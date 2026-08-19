import datetime
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from .models import Doctor, DoctorSchedule, AppointmentSlot
from .serializers import (
    DoctorSerializer,
    DoctorScheduleSerializer,
    AppointmentSlotSerializer,
    BlockSlotSerializer,
)
from .tasks import generate_slots_for_doctor


class DoctorListView(generics.ListAPIView):
    serializer_class = DoctorSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        queryset = Doctor.objects.filter(is_active=True).select_related(
            'department', 'department__hospital'
        ).prefetch_related('schedules').order_by('name')

        search = self.request.query_params.get('search', '').strip()
        department = self.request.query_params.get('department', '').strip()
        hospital = self.request.query_params.get('hospital', '').strip()
        specialization = self.request.query_params.get('specialization', '').strip()

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(specialization__icontains=search) |
                Q(department__name__icontains=search) |
                Q(department__hospital__name__icontains=search) |
                Q(department__hospital__city__icontains=search)
            )
        if department:
            queryset = queryset.filter(department_id=department)
        if hospital:
            queryset = queryset.filter(department__hospital_id=hospital)
        if specialization:
            queryset = queryset.filter(specialization__icontains=specialization)

        return queryset

    @extend_schema(
        summary="List all active doctors",
        description="Fetch a list of active doctors with optional search, department, hospital, or specialization filtering.",
        parameters=[
            OpenApiParameter(name='search', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Search by doctor name, hospital, or specialty'),
            OpenApiParameter(name='department', type=OpenApiTypes.INT, location=OpenApiParameter.QUERY, description='Filter by department ID'),
            OpenApiParameter(name='hospital', type=OpenApiTypes.INT, location=OpenApiParameter.QUERY, description='Filter by hospital ID'),
            OpenApiParameter(name='specialization', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Filter by specialization'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class DepartmentDoctorsView(generics.ListAPIView):
    serializer_class = DoctorSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        dept_id = self.kwargs.get('pk')
        return Doctor.objects.filter(department_id=dept_id, is_active=True).select_related(
            'department', 'department__hospital'
        ).prefetch_related('schedules').order_by('name')

    @extend_schema(summary="List active doctors in a department")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class DoctorDetailView(generics.RetrieveAPIView):
    queryset = Doctor.objects.select_related('department', 'department__hospital').prefetch_related('schedules').all()
    serializer_class = DoctorSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    @extend_schema(summary="Get doctor details including schedules")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class DoctorSlotsView(generics.ListAPIView):
    serializer_class = AppointmentSlotSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        doctor_id = self.kwargs.get('pk')
        doctor = generics.get_object_or_404(Doctor, pk=doctor_id)

        # Optional date filter, defaults to today onwards
        date_str = self.request.query_params.get('date', None)
        today = timezone.now().date()

        if date_str:
            try:
                query_date = datetime.date.fromisoformat(date_str)
            except ValueError:
                query_date = today
            queryset = AppointmentSlot.objects.filter(doctor=doctor, date=query_date)
        else:
            queryset = AppointmentSlot.objects.filter(
                doctor=doctor,
                date__gte=today,
                date__lte=today + datetime.timedelta(days=30)
            )

        # If no slots found, opportunistically trigger slot generation for this doctor
        if not queryset.exists():
            generate_slots_for_doctor(doctor, days_ahead=30)
            if date_str:
                queryset = AppointmentSlot.objects.filter(doctor=doctor, date=query_date)
            else:
                queryset = AppointmentSlot.objects.filter(
                    doctor=doctor,
                    date__gte=today,
                    date__lte=today + datetime.timedelta(days=30)
                )

        return queryset.order_by('date', 'start_time')

    @extend_schema(
        summary="List doctor appointment slots",
        description="Retrieve available and booked appointment slots for a doctor with optional ?date=YYYY-MM-DD parameter.",
        parameters=[
            OpenApiParameter(name='date', type=OpenApiTypes.DATE, location=OpenApiParameter.QUERY, description='Filter by specific date (YYYY-MM-DD)'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class DoctorScheduleCreateView(generics.CreateAPIView):
    serializer_class = DoctorScheduleSerializer
    permission_classes = (permissions.IsAdminUser,)

    @extend_schema(summary="Create a recurring schedule for a doctor (Admin/Staff only)")
    def perform_create(self, serializer):
        doctor_id = self.kwargs.get('pk')
        doctor = generics.get_object_or_404(Doctor, pk=doctor_id)
        schedule = serializer.save(doctor=doctor)
        # Regenerate upcoming slots for this doctor
        generate_slots_for_doctor(doctor, days_ahead=30)


class BlockSlotView(APIView):
    permission_classes = (permissions.IsAdminUser,)

    @extend_schema(
        summary="Block or unblock an appointment slot (Staff/Admin only)",
        request=BlockSlotSerializer,
        responses={200: AppointmentSlotSerializer, 400: OpenApiTypes.OBJECT}
    )
    def patch(self, request, pk):
        slot = generics.get_object_or_404(AppointmentSlot, pk=pk)
        serializer = BlockSlotSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        blocked = serializer.validated_data['blocked']

        if blocked:
            if slot.status == AppointmentSlot.STATUS_BOOKED:
                return Response(
                    {'error': 'Cannot block a slot that is already booked.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            slot.status = AppointmentSlot.STATUS_BLOCKED
        else:
            if slot.status == AppointmentSlot.STATUS_BLOCKED:
                slot.status = AppointmentSlot.STATUS_AVAILABLE

        slot.save()
        return Response(AppointmentSlotSerializer(slot).data)
