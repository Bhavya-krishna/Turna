from django.db import models
from django.conf import settings
from hospitals.models import Hospital
from doctors.models import Doctor, AppointmentSlot


class Booking(models.Model):
    STATUS_CONFIRMED = 'CONFIRMED'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_COMPLETED = 'COMPLETED'

    STATUS_CHOICES = [
        (STATUS_CONFIRMED, 'Confirmed'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    PAYMENT_PENDING = 'PENDING'
    PAYMENT_SUCCESS = 'SUCCESS'
    PAYMENT_FAILED = 'FAILED'
    PAYMENT_REFUNDED = 'REFUNDED'

    PAYMENT_STATUS_CHOICES = [
        (PAYMENT_PENDING, 'Pending'),
        (PAYMENT_SUCCESS, 'Success'),
        (PAYMENT_FAILED, 'Failed'),
        (PAYMENT_REFUNDED, 'Refunded'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    slot = models.OneToOneField(AppointmentSlot, on_delete=models.PROTECT, related_name='booking')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='bookings')
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='bookings')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_CONFIRMED, db_index=True)

    payment_id = models.CharField(max_length=255, blank=True)
    payment_order_id = models.CharField(max_length=255, blank=True)
    payment_signature = models.CharField(max_length=255, blank=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default=PAYMENT_SUCCESS)
    amount_paid = models.DecimalField(max_digits=8, decimal_places=2, default=500.00)

    patient_name = models.CharField(max_length=255, blank=True)
    patient_phone = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Booking'
        verbose_name_plural = 'Bookings'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['doctor', 'status']),
        ]

    def __str__(self):
        return f"Booking #{self.id} - {self.user.email} with Dr. {self.doctor.name} on {self.slot.date} [{self.status}]"
