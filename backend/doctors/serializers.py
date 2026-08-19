from rest_framework import serializers
from .models import Doctor, DoctorSchedule, AppointmentSlot


class DoctorScheduleSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = DoctorSchedule
        fields = ('id', 'doctor', 'day_of_week', 'day_name', 'start_time', 'end_time', 'slot_duration_minutes', 'created_at')
        read_only_fields = ('id', 'created_at')


class AppointmentSlotSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    hospital_name = serializers.CharField(source='doctor.department.hospital.name', read_only=True)
    department_name = serializers.CharField(source='doctor.department.name', read_only=True)
    fee = serializers.DecimalField(source='doctor.consultation_fee', max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = AppointmentSlot
        fields = (
            'id', 'doctor', 'doctor_name', 'hospital_name', 'department_name',
            'date', 'start_time', 'end_time', 'status', 'fee', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class DoctorSerializer(serializers.ModelSerializer):
    hospital_id = serializers.IntegerField(source='department.hospital.id', read_only=True)
    hospital_name = serializers.CharField(source='department.hospital.name', read_only=True)
    hospital_city = serializers.CharField(source='department.hospital.city', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    schedules = DoctorScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Doctor
        fields = (
            'id', 'department', 'department_name', 'hospital_id', 'hospital_name', 'hospital_city',
            'name', 'specialization', 'email', 'phone', 'experience_years',
            'consultation_fee', 'image_url', 'is_active', 'schedules', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class BlockSlotSerializer(serializers.Serializer):
    blocked = serializers.BooleanField(required=True)
    reason = serializers.CharField(required=False, allow_blank=True, default='')
