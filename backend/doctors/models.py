from django.db import models
from hospitals.models import Department


class Doctor(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='doctors')
    name = models.CharField(max_length=255, db_index=True)
    specialization = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    experience_years = models.PositiveIntegerField(default=1)
    consultation_fee = models.DecimalField(max_digits=8, decimal_places=2, default=500.00)
    image_url = models.URLField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Doctor'
        verbose_name_plural = 'Doctors'

    def __str__(self):
        return f"Dr. {self.name} ({self.specialization}) - {self.department.hospital.name}"


class DoctorSchedule(models.Model):
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.PositiveIntegerField(default=30)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['day_of_week', 'start_time']
        verbose_name = 'Doctor Schedule'
        verbose_name_plural = 'Doctor Schedules'
        unique_together = ('doctor', 'day_of_week', 'start_time', 'end_time')

    def __str__(self):
        day_name = dict(self.DAY_CHOICES).get(self.day_of_week, '')
        return f"{self.doctor.name} - {day_name} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')})"


class AppointmentSlot(models.Model):
    STATUS_AVAILABLE = 'AVAILABLE'
    STATUS_BOOKED = 'BOOKED'
    STATUS_BLOCKED = 'BLOCKED'

    STATUS_CHOICES = [
        (STATUS_AVAILABLE, 'Available'),
        (STATUS_BOOKED, 'Booked'),
        (STATUS_BLOCKED, 'Blocked'),
    ]

    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='slots')
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_AVAILABLE, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'start_time']
        verbose_name = 'Appointment Slot'
        verbose_name_plural = 'Appointment Slots'
        unique_together = ('doctor', 'date', 'start_time')
        indexes = [
            models.Index(fields=['doctor', 'date', 'status']),
            models.Index(fields=['date', 'status']),
        ]

    def __str__(self):
        return f"{self.doctor.name} | {self.date} {self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')} [{self.status}]"
