import datetime
from celery import shared_task
from django.utils import timezone
from .models import Doctor, DoctorSchedule, AppointmentSlot


def generate_slots_for_doctor(doctor: Doctor, days_ahead: int = 30) -> int:
    """
    Generates appointment slots for a given doctor for the specified number of days ahead
    based on their registered DoctorSchedule entries.
    Avoids duplicate slots and respects existing slots.
    Returns the count of new slots created.
    """
    today = timezone.now().date()
    schedules = doctor.schedules.all()
    if not schedules.exists():
        return 0

    slots_created = 0

    for day_offset in range(days_ahead):
        target_date = today + datetime.timedelta(days=day_offset)
        target_day_of_week = target_date.weekday() # 0 = Monday, 6 = Sunday

        applicable_schedules = [s for s in schedules if s.day_of_week == target_day_of_week]

        for sched in applicable_schedules:
            start_dt = datetime.datetime.combine(target_date, sched.start_time)
            end_dt = datetime.datetime.combine(target_date, sched.end_time)
            duration = datetime.timedelta(minutes=sched.slot_duration_minutes)

            current_slot_start = start_dt
            while current_slot_start + duration <= end_dt:
                current_slot_end = current_slot_start + duration
                
                # Check if slot already exists
                slot, created = AppointmentSlot.objects.get_or_create(
                    doctor=doctor,
                    date=target_date,
                    start_time=current_slot_start.time(),
                    defaults={
                        'end_time': current_slot_end.time(),
                        'status': AppointmentSlot.STATUS_AVAILABLE,
                    }
                )
                if created:
                    slots_created += 1

                current_slot_start = current_slot_end

    return slots_created


@shared_task(name='doctors.tasks.generate_all_doctor_slots_task')
def generate_all_doctor_slots_task(days: int = 30):
    """
    Celery task that scans all active doctors and generates upcoming appointment slots.
    """
    active_doctors = Doctor.objects.filter(is_active=True).prefetch_related('schedules')
    total_created = 0
    for doctor in active_doctors:
        total_created += generate_slots_for_doctor(doctor, days_ahead=days)
    
    return f"Successfully generated {total_created} slots across {active_doctors.count()} active doctors."
