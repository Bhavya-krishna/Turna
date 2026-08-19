import datetime
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from hospitals.models import Hospital, Department
from doctors.models import Doctor, DoctorSchedule, AppointmentSlot
from doctors.tasks import generate_slots_for_doctor

User = get_user_model()


class DoctorTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='staff@turna.health',
            password='StaffPassword123!',
            is_staff=True
        )
        self.patient = User.objects.create_user(
            email='patient@turna.health',
            password='PatientPassword123!'
        )

        self.hospital = Hospital.objects.create(name='Memorial Hospital', city='Boston', address='100 Main St')
        self.dept = Department.objects.create(hospital=self.hospital, name='Cardiology')
        self.doctor = Doctor.objects.create(
            department=self.dept,
            name='Gregory House',
            specialization='Diagnostic Medicine',
            experience_years=20,
            consultation_fee=800.00
        )
        # Add Monday schedule 09:00 - 11:00 (30 min slots => 4 slots)
        self.schedule = DoctorSchedule.objects.create(
            doctor=self.doctor,
            day_of_week=0, # Monday
            start_time=datetime.time(9, 0),
            end_time=datetime.time(11, 0),
            slot_duration_minutes=30
        )

    def test_department_doctors_list(self):
        response = self.client.get(f'/api/departments/{self.dept.id}/doctors/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Gregory House')

    def test_doctor_detail(self):
        response = self.client.get(f'/api/doctors/{self.doctor.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['specialization'], 'Diagnostic Medicine')
        self.assertEqual(len(response.data['schedules']), 1)

    def test_slot_generation_logic(self):
        # Generate slots for next 14 days
        slots_count = generate_slots_for_doctor(self.doctor, days_ahead=14)
        self.assertGreater(slots_count, 0)

        # Generating again shouldn't create duplicate slots
        duplicates_count = generate_slots_for_doctor(self.doctor, days_ahead=14)
        self.assertEqual(duplicates_count, 0)

    def test_doctor_slots_api(self):
        # Querying doctor slots should auto-generate slots and return them
        response = self.client.get(f'/api/doctors/{self.doctor.id}/slots/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)

    def test_block_slot_staff_only(self):
        # Create a single slot
        today = timezone.now().date()
        slot = AppointmentSlot.objects.create(
            doctor=self.doctor,
            date=today,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(9, 30),
            status=AppointmentSlot.STATUS_AVAILABLE
        )

        # Unauthenticated / patient user should be forbidden
        self.client.force_authenticate(user=self.patient)
        resp_forbidden = self.client.patch(f'/api/slots/{slot.id}/block/', {'blocked': True})
        self.assertEqual(resp_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        # Staff user should succeed
        self.client.force_authenticate(user=self.admin_user)
        resp_success = self.client.patch(f'/api/slots/{slot.id}/block/', {'blocked': True})
        self.assertEqual(resp_success.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_success.data['status'], AppointmentSlot.STATUS_BLOCKED)

        slot.refresh_from_db()
        self.assertEqual(slot.status, AppointmentSlot.STATUS_BLOCKED)
