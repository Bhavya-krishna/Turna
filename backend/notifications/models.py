from django.db import models


class Notification(models.Model):
    TYPE_CONFIRMATION = 'CONFIRMATION'
    TYPE_REMINDER = 'REMINDER'

    TYPE_CHOICES = [
        (TYPE_CONFIRMATION, 'Booking Confirmation'),
        (TYPE_REMINDER, 'Appointment Reminder (30m Before)'),
    ]

    STATUS_PENDING = 'PENDING'
    STATUS_SENT = 'SENT'
    STATUS_FAILED = 'FAILED'
    STATUS_CANCELLED = 'CANCELLED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_SENT, 'Sent'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    scheduled_at = models.DateTimeField(db_index=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    celery_task_id = models.CharField(max_length=255, blank=True)
    recipient_email = models.EmailField(blank=True)
    message_body = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f"{self.type} - Booking #{self.booking_id} [{self.status}]"
