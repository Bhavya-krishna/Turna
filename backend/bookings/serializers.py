from rest_framework import serializers
from .models import Booking
from doctors.models import AppointmentSlot
from doctors.serializers import AppointmentSlotSerializer
from hospitals.serializers import HospitalListSerializer
from notifications.models import Notification


class NotificationSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'type', 'scheduled_at', 'sent_at', 'status', 'created_at')


class BookingCreateSerializer(serializers.Serializer):
    slot_id = serializers.IntegerField(required=True)
    patient_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    patient_phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    payment_id = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    payment_order_id = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    payment_signature = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')


class BookingListSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_city = serializers.CharField(source='hospital.city', read_only=True)
    department_name = serializers.CharField(source='doctor.department.name', read_only=True)
    slot_date = serializers.DateField(source='slot.date', read_only=True)
    slot_start_time = serializers.TimeField(source='slot.start_time', read_only=True)
    slot_end_time = serializers.TimeField(source='slot.end_time', read_only=True)

    class Meta:
        model = Booking
        fields = (
            'id', 'user', 'slot', 'doctor', 'doctor_name', 'doctor_specialization',
            'hospital', 'hospital_name', 'hospital_city', 'department_name',
            'slot_date', 'slot_start_time', 'slot_end_time',
            'status', 'payment_id', 'payment_status', 'amount_paid',
            'patient_name', 'patient_phone', 'created_at'
        )
        read_only_fields = fields


class BookingDetailSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)
    doctor_phone = serializers.CharField(source='doctor.phone', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_address = serializers.CharField(source='hospital.address', read_only=True)
    hospital_city = serializers.CharField(source='hospital.city', read_only=True)
    department_name = serializers.CharField(source='doctor.department.name', read_only=True)
    slot = AppointmentSlotSerializer(read_only=True)
    slot_date = serializers.DateField(source='slot.date', read_only=True)
    slot_start_time = serializers.TimeField(source='slot.start_time', read_only=True)
    slot_end_time = serializers.TimeField(source='slot.end_time', read_only=True)
    notifications = NotificationSimpleSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = (
            'id', 'user', 'slot', 'doctor', 'doctor_name', 'doctor_specialization', 'doctor_phone',
            'hospital', 'hospital_name', 'hospital_address', 'hospital_city', 'department_name',
            'slot_date', 'slot_start_time', 'slot_end_time',
            'status', 'payment_id', 'payment_order_id', 'payment_status', 'amount_paid',
            'patient_name', 'patient_phone', 'notes', 'notifications', 'created_at', 'updated_at'
        )
        read_only_fields = fields


class PaymentInitiateSerializer(serializers.Serializer):
    slot_id = serializers.IntegerField(required=True)
