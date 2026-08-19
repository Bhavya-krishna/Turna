from django.contrib import admin
from .models import Doctor, DoctorSchedule, AppointmentSlot


class DoctorScheduleInline(admin.TabularInline):
    model = DoctorSchedule
    extra = 1


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'specialization', 'department', 'consultation_fee', 'is_active')
    list_filter = ('is_active', 'department__hospital', 'specialization')
    search_fields = ('name', 'specialization', 'email', 'phone')
    inlines = [DoctorScheduleInline]


@admin.register(DoctorSchedule)
class DoctorScheduleAdmin(admin.ModelAdmin):
    list_display = ('id', 'doctor', 'day_of_week', 'start_time', 'end_time', 'slot_duration_minutes')
    list_filter = ('day_of_week', 'doctor__department__hospital')
    search_fields = ('doctor__name',)


@admin.register(AppointmentSlot)
class AppointmentSlotAdmin(admin.ModelAdmin):
    list_display = ('id', 'doctor', 'date', 'start_time', 'end_time', 'status', 'created_at')
    list_filter = ('status', 'date', 'doctor__department__hospital')
    search_fields = ('doctor__name',)
    date_hierarchy = 'date'
