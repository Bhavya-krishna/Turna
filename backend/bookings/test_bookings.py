import datetime
import concurrent.futures
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from hospitals.models import Hospital, Department
from doctors.models import Doctor, AppointmentSlot
from bookings.models import Booking
from notifications.models import Notification

User = get_user_model()


class BookingLogicTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.patient = User.objects.create_user(
            email='patient@turna.health',
            password='PatientPassword123!',
            name='Patient Test'
        )
        self.client.force_authenticate(user=self.patient)

        self.hospital = Hospital.objects.create(name='General Hospital', city='Miami', address='200 Ocean Dr')
        self.dept = Department.objects.create(hospital=self.hospital, name='Orthopedics')
        self.doctor = Doctor.objects.create(
            department=self.dept,
            name='Dr. John Watson',
            specialization='Orthopedic Surgeon',
            consultation_fee=600.00
        )

        today = timezone.now().date() + datetime.timedelta(days=1)
        self.slot = AppointmentSlot.objects.create(
            doctor=self.doctor,
            date=today,
            start_time=datetime.time(10, 0),
            end_time=datetime.time(10, 30),
            status=AppointmentSlot.STATUS_AVAILABLE
        )

    def test_booking_initiate_payment(self):
        payload = {'slot_id': self.slot.id}
        response = self.client.post('/api/bookings/initiate-payment/', payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('order_id', response.data)
        self.assertEqual(response.data['amount'], 600.00)

    def test_single_booking_success(self):
        payload = {
            'slot_id': self.slot.id,
            'patient_name': 'Patient Test',
            'patient_phone': '+15550001',
            'payment_id': 'pay_test_123',
            'payment_order_id': 'order_test_123'
        }
        response = self.client.post('/api/bookings/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'CONFIRMED')
        self.assertEqual(response.data['doctor_name'], 'Dr. John Watson')

        # Verify slot status changed to BOOKED
        self.slot.refresh_from_db()
        self.assertEqual(self.slot.status, AppointmentSlot.STATUS_BOOKED)

        # Verify notification created
        booking_id = response.data['id']
        notifications = Notification.objects.filter(booking_id=booking_id)
        self.assertTrue(notifications.exists())

    def test_double_booking_prevention_sequential(self):
        payload = {
            'slot_id': self.slot.id,
            'patient_name': 'Patient Test',
            'payment_id': 'pay_test_123',
        }
        # First booking succeeds
        resp1 = self.client.post('/api/bookings/', payload)
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)

        # Second booking fails with 409 Conflict
        resp2 = self.client.post('/api/bookings/', payload)
        self.assertEqual(resp2.status_code, status.HTTP_409_CONFLICT)

    def test_blocked_slot_booking_rejected(self):
        self.slot.status = AppointmentSlot.STATUS_BLOCKED
        self.slot.save()

        payload = {'slot_id': self.slot.id}
        response = self.client.post('/api/bookings/', payload)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_booking_cancellation(self):
        # Create booking
        payload = {
            'slot_id': self.slot.id,
            'patient_name': 'Patient Test',
            'payment_id': 'pay_test_123',
        }
        resp_book = self.client.post('/api/bookings/', payload)
        booking_id = resp_book.data['id']

        # Cancel booking
        resp_cancel = self.client.post(f'/api/bookings/{booking_id}/cancel/')
        self.assertEqual(resp_cancel.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_cancel.data['status'], 'CANCELLED')
        self.assertEqual(resp_cancel.data['slot_status'], 'AVAILABLE')

        # Verify slot returned to AVAILABLE in database
        self.slot.refresh_from_db()
        self.assertEqual(self.slot.status, AppointmentSlot.STATUS_AVAILABLE)


class ConcurrentBookingTransactionTests(TransactionTestCase):
    """
    Simulates real concurrent booking attempts from multiple threads using TransactionTestCase.
    Asserts that under race conditions, exactly 1 succeeds and all others receive 409 CONFLICT.
    """
    def setUp(self):
        self.user1 = User.objects.create_user(email='concurrent1@turna.health', password='Password123!')
        self.user2 = User.objects.create_user(email='concurrent2@turna.health', password='Password123!')

        self.hospital = Hospital.objects.create(name='Race Care Hospital', city='Seattle', address='300 Pine St')
        self.dept = Department.objects.create(hospital=self.hospital, name='Neurology')
        self.doctor = Doctor.objects.create(
            department=self.dept,
            name='Dr. Strange',
            specialization='Neurosurgeon',
            consultation_fee=950.00
        )

        today = timezone.now().date() + datetime.timedelta(days=2)
        self.slot = AppointmentSlot.objects.create(
            doctor=self.doctor,
            date=today,
            start_time=datetime.time(14, 0),
            end_time=datetime.time(14, 30),
            status=AppointmentSlot.STATUS_AVAILABLE
        )

    def test_concurrent_double_booking_race_condition(self):
        slot_id = self.slot.id

        def book_slot(user):
            client = APIClient()
            client.force_authenticate(user=user)
            return client.post('/api/bookings/', {
                'slot_id': slot_id,
                'patient_name': user.email,
                'payment_id': f'pay_{user.id}',
            })

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future1 = executor.submit(book_slot, self.user1)
            future2 = executor.submit(book_slot, self.user2)

            res1 = future1.result()
            res2 = future2.result()

        status_codes = [res1.status_code, res2.status_code]

        # Exactly one booking must succeed (201) and the other must be rejected with 409 Conflict
        self.assertIn(status.HTTP_201_CREATED, status_codes)
        self.assertIn(status.HTTP_409_CONFLICT, status_codes)
        self.assertEqual(status_codes.count(status.HTTP_201_CREATED), 1)
        self.assertEqual(status_codes.count(status.HTTP_409_CONFLICT), 1)

        # Database should contain exactly 1 confirmed booking for this slot
        confirmed_bookings = Booking.objects.filter(slot_id=slot_id, status=Booking.STATUS_CONFIRMED)
        self.assertEqual(confirmed_bookings.count(), 1)
