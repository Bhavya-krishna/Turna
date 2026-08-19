import datetime
import logging
from django.conf import settings
from django.db import transaction, DatabaseError, OperationalError
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import Booking
from .serializers import (
    BookingCreateSerializer,
    BookingListSerializer,
    BookingDetailSerializer,
    PaymentInitiateSerializer,
)
from doctors.models import AppointmentSlot
from notifications.models import Notification
from notifications.services import get_notification_service
from notifications.tasks import send_appointment_reminder_task
from core.exceptions import SlotUnavailableConflictException
from core.payments import get_payment_provider
from turna.celery import app as celery_app

logger = logging.getLogger(__name__)


class InitiatePaymentView(APIView):
    """
    Creates a payment order (Razorpay test mode) for the chosen appointment slot.
    """
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        summary="Initiate payment for an appointment slot",
        request=PaymentInitiateSerializer,
        responses={200: OpenApiResponse(description="Payment order created")}
    )
    def post(self, request):
        serializer = PaymentInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        slot_id = serializer.validated_data['slot_id']

        slot = generics.get_object_or_404(
            AppointmentSlot.objects.select_related('doctor', 'doctor__department__hospital'),
            pk=slot_id
        )

        if slot.status != AppointmentSlot.STATUS_AVAILABLE:
            raise SlotUnavailableConflictException("This slot is already booked or blocked.")

        payment_provider = get_payment_provider()
        receipt_id = f"rcpt_slot_{slot.id}_user_{request.user.id}"
        order = payment_provider.create_order(
            amount_in_inr=float(slot.doctor.consultation_fee),
            receipt_id=receipt_id,
            notes={
                'slot_id': slot.id,
                'doctor_id': slot.doctor.id,
                'doctor_name': slot.doctor.name,
                'hospital_name': slot.doctor.department.hospital.name,
                'user_email': request.user.email,
            }
        )

        return Response(order, status=status.HTTP_200_OK)


class BookingCreateView(generics.ListCreateAPIView):
    """
    Lists user bookings (GET) and creates a new hospital appointment booking (POST).
    Guaranteed Concurrency Safety with PostgreSQL select_for_update() row-level locking.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return BookingListSerializer
        return BookingCreateSerializer

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).select_related(
            'slot', 'doctor', 'doctor__department', 'hospital'
        ).order_by('-created_at')

    @extend_schema(
        summary="List current user's bookings",
        description="Returns list of upcoming and past bookings for the authenticated user.",
        responses={200: BookingListSerializer(many=True)}
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Book an appointment slot",
        description="Concurrency-safe slot booking. Uses database transactions and row-level locks. Returns 409 Conflict if already booked.",
        responses={
            201: BookingDetailSerializer,
            409: OpenApiResponse(description="Conflict: Slot was already booked or blocked"),
            400: OpenApiResponse(description="Validation error"),
        }
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        slot_id = serializer.validated_data['slot_id']
        patient_name = serializer.validated_data.get('patient_name') or request.user.name or request.user.email
        patient_phone = serializer.validated_data.get('patient_phone') or request.user.phone
        notes = serializer.validated_data.get('notes', '')
        payment_id = serializer.validated_data.get('payment_id', '')
        payment_order_id = serializer.validated_data.get('payment_order_id', '')
        payment_signature = serializer.validated_data.get('payment_signature', '')

        # Concurrency-safe atomic transaction with row-level lock
        try:
            with transaction.atomic():
                try:
                    slot = AppointmentSlot.objects.select_for_update().select_related(
                        'doctor', 'doctor__department', 'doctor__department__hospital'
                    ).get(id=slot_id)
                except AppointmentSlot.DoesNotExist:
                    return Response({'error': 'Appointment slot not found.'}, status=status.HTTP_404_NOT_FOUND)

                # Check slot availability
                if slot.status != AppointmentSlot.STATUS_AVAILABLE:
                    raise SlotUnavailableConflictException("The requested appointment slot is no longer available.")

                # Validate payment
                payment_provider = get_payment_provider()
                payment_verified = payment_provider.verify_payment(
                    payment_id=payment_id or 'pay_mock_test',
                    order_id=payment_order_id,
                    signature=payment_signature
                )
                if not payment_verified:
                    return Response({'error': 'Payment verification failed.'}, status=status.HTTP_400_BAD_REQUEST)

                # Mark slot as booked
                slot.status = AppointmentSlot.STATUS_BOOKED
                slot.save(update_fields=['status'])

                # Create Booking
                booking = Booking.objects.create(
                    user=request.user,
                    slot=slot,
                    doctor=slot.doctor,
                    hospital=slot.doctor.department.hospital,
                    status=Booking.STATUS_CONFIRMED,
                    payment_id=payment_id or f"pay_mock_{timezone.now().strftime('%Y%m%d%H%M%S')}",
                    payment_order_id=payment_order_id,
                    payment_signature=payment_signature,
                    payment_status=Booking.PAYMENT_SUCCESS,
                    amount_paid=slot.doctor.consultation_fee,
                    patient_name=patient_name,
                    patient_phone=patient_phone,
                    notes=notes,
                )

                # Compute reminder datetime (30 minutes prior to appointment start time)
                appointment_naive = datetime.datetime.combine(slot.date, slot.start_time)
                # Default to UTC if naive
                if timezone.is_naive(appointment_naive):
                    appointment_dt = timezone.make_aware(appointment_naive, datetime.timezone.utc)
                else:
                    appointment_dt = appointment_naive

                reminder_dt = appointment_dt - datetime.timedelta(minutes=30)
                now = timezone.now()

                # Create Confirmation Notification & dispatch email
                confirmation_notif = Notification.objects.create(
                    booking=booking,
                    type=Notification.TYPE_CONFIRMATION,
                    scheduled_at=now,
                    status=Notification.STATUS_SENT,
                    recipient_email=request.user.email,
                    sent_at=now,
                )
                try:
                    get_notification_service().send_booking_confirmation(booking)
                except Exception as e:
                    logger.error(f"Error sending confirmation email: {e}")

                # Schedule 30m Reminder Notification via Celery (if reminder_dt is in the future)
                reminder_notif = Notification.objects.create(
                    booking=booking,
                    type=Notification.TYPE_REMINDER,
                    scheduled_at=reminder_dt,
                    status=Notification.STATUS_PENDING,
                    recipient_email=request.user.email,
                )

                try:
                    if reminder_dt > now:
                        task = send_appointment_reminder_task.apply_async(
                            args=[reminder_notif.id],
                            eta=reminder_dt
                        )
                        reminder_notif.celery_task_id = task.id
                    else:
                        # If appointment is in less than 30 mins, send reminder now
                        task = send_appointment_reminder_task.delay(reminder_notif.id)
                        reminder_notif.celery_task_id = task.id
                    reminder_notif.save(update_fields=['celery_task_id'])
                except Exception as e:
                    logger.warning(f"Could not enqueue Celery reminder task: {e}")
        except (OperationalError, DatabaseError) as db_err:
            logger.warning(f"Database concurrency lock contention: {db_err}")
            raise SlotUnavailableConflictException("The requested appointment slot is currently being processed or unavailable.")

        # Return full serialized booking
        return Response(BookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED)


class UserBookingsListView(generics.ListAPIView):
    """
    Returns list of upcoming and past bookings for the authenticated user.
    """
    serializer_class = BookingListSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).select_related(
            'slot', 'doctor', 'doctor__department', 'hospital'
        ).order_by('-created_at')

    @extend_schema(summary="Get all bookings for the current authenticated user")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class BookingDetailView(generics.RetrieveAPIView):
    """
    Get detailed information for a specific booking.
    """
    serializer_class = BookingDetailSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Booking.objects.select_related(
                'slot', 'doctor', 'doctor__department', 'hospital'
            ).prefetch_related('notifications').all()
        return Booking.objects.filter(user=user).select_related(
            'slot', 'doctor', 'doctor__department', 'hospital'
        ).prefetch_related('notifications').all()

    @extend_schema(summary="Get booking details by ID")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class BookingCancelView(APIView):
    """
    Cancels an active booking, releases the appointment slot back to AVAILABLE,
    and revokes the scheduled Celery reminder task.
    """
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        summary="Cancel a booking",
        description="Cancels the booking, reverts slot status to AVAILABLE, and revokes scheduled reminder tasks.",
        responses={
            200: OpenApiResponse(description="Booking successfully cancelled"),
            400: OpenApiResponse(description="Cannot cancel an already cancelled booking"),
            404: OpenApiResponse(description="Booking not found"),
        }
    )
    def post(self, request, pk):
        return self._cancel_booking(request, pk)

    def delete(self, request, pk):
        return self._cancel_booking(request, pk)

    def _cancel_booking(self, request, pk):
        with transaction.atomic():
            try:
                if request.user.is_staff:
                    booking = Booking.objects.select_for_update().select_related('slot').get(pk=pk)
                else:
                    booking = Booking.objects.select_for_update().select_related('slot').get(pk=pk, user=request.user)
            except Booking.DoesNotExist:
                return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

            if booking.status == Booking.STATUS_CANCELLED:
                return Response({'error': 'Booking is already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

            # Mark booking as cancelled and refund payment status
            booking.status = Booking.STATUS_CANCELLED
            booking.payment_status = Booking.PAYMENT_REFUNDED
            booking.save(update_fields=['status', 'payment_status', 'updated_at'])

            # Release appointment slot back to AVAILABLE
            slot = booking.slot
            slot.status = AppointmentSlot.STATUS_AVAILABLE
            slot.save(update_fields=['status'])

            # Revoke scheduled Celery reminder tasks & update notifications
            reminder_notifications = Notification.objects.filter(
                booking=booking,
                type=Notification.TYPE_REMINDER,
                status=Notification.STATUS_PENDING
            )
            for notif in reminder_notifications:
                if notif.celery_task_id and not getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
                    try:
                        celery_app.control.revoke(notif.celery_task_id, terminate=True, timeout=0.5)
                    except Exception as e:
                        logger.warning(f"Failed to revoke celery task {notif.celery_task_id}: {e}")
                notif.status = Notification.STATUS_CANCELLED
                notif.save(update_fields=['status'])

        return Response({
            'message': 'Booking successfully cancelled and slot is now available.',
            'booking_id': booking.id,
            'status': booking.status,
            'slot_status': slot.status,
        }, status=status.HTTP_200_OK)
