import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from hospitals.models import Hospital, Department
from doctors.models import Doctor, DoctorSchedule, AppointmentSlot
from doctors.tasks import generate_slots_for_doctor
from bookings.models import Booking
from notifications.models import Notification

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds database with realistic dummy accounts, hospitals, departments, doctors, schedules, slots, and sample bookings.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting Turna database seeding...'))

        # 1. Create Users
        admin_user, created = User.objects.get_or_create(
            email='admin@turna.health',
            defaults={
                'name': 'Turna Super Admin',
                'phone': '+1-800-555-0100',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('Admin@123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Created superuser: admin@turna.health / Admin@123'))

        staff_user, created = User.objects.get_or_create(
            email='staff@turna.health',
            defaults={
                'name': 'Hospital Coordinator',
                'phone': '+1-800-555-0101',
                'is_staff': True,
                'is_superuser': False,
            }
        )
        if created:
            staff_user.set_password('Staff@123')
            staff_user.save()
            self.stdout.write(self.style.SUCCESS('Created staff user: staff@turna.health / Staff@123'))

        patient1, created = User.objects.get_or_create(
            email='patient1@turna.health',
            defaults={
                'name': 'Alice Jenkins',
                'phone': '+1-555-0192',
                'is_staff': False,
                'is_superuser': False,
            }
        )
        if created:
            patient1.set_password('Patient@123')
            patient1.save()
            self.stdout.write(self.style.SUCCESS('Created patient: patient1@turna.health / Patient@123'))

        patient2, created = User.objects.get_or_create(
            email='patient2@turna.health',
            defaults={
                'name': 'Robert Davis',
                'phone': '+1-555-0284',
                'is_staff': False,
                'is_superuser': False,
            }
        )
        if created:
            patient2.set_password('Patient@123')
            patient2.save()
            self.stdout.write(self.style.SUCCESS('Created patient: patient2@turna.health / Patient@123'))

        # 2. Seed Hospitals Data
        hospitals_data = [
            {
                'name': 'City General Hospital',
                'city': 'New York',
                'address': '450 Lexington Ave, New York, NY 10017',
                'latitude': 40.7527,
                'longitude': -73.9772,
                'phone': '+1-212-555-0144',
                'email': 'info@citygeneral.org',
                'image_url': 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
                'departments': [
                    {
                        'name': 'Cardiology',
                        'description': 'Advanced cardiovascular care, diagnostic ECG, angiography, and heart health management.',
                        'doctors': [
                            {
                                'name': 'Sarah Mitchell',
                                'specialization': 'Interventional Cardiologist',
                                'email': 'dr.mitchell@citygeneral.org',
                                'phone': '+1-212-555-0145',
                                'experience_years': 14,
                                'consultation_fee': 750.00,
                                'image_url': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=500&q=80',
                                'schedules': [
                                    (0, datetime.time(9, 0), datetime.time(13, 0), 30), # Mon
                                    (2, datetime.time(9, 0), datetime.time(13, 0), 30), # Wed
                                    (4, datetime.time(9, 0), datetime.time(13, 0), 30), # Fri
                                ]
                            },
                            {
                                'name': 'David Chen',
                                'specialization': 'Electrophysiologist & Arrhythmia Specialist',
                                'email': 'dr.chen@citygeneral.org',
                                'phone': '+1-212-555-0146',
                                'experience_years': 9,
                                'consultation_fee': 600.00,
                                'image_url': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=500&q=80',
                                'schedules': [
                                    (1, datetime.time(10, 0), datetime.time(14, 0), 30), # Tue
                                    (3, datetime.time(10, 0), datetime.time(14, 0), 30), # Thu
                                ]
                            }
                        ]
                    },
                    {
                        'name': 'Neurology',
                        'description': 'Comprehensive brain, spine, stroke, and nervous system diagnostics and therapy.',
                        'doctors': [
                            {
                                'name': 'Elena Rostova',
                                'specialization': 'Senior Neurologist & Stroke Specialist',
                                'email': 'dr.rostova@citygeneral.org',
                                'phone': '+1-212-555-0147',
                                'experience_years': 18,
                                'consultation_fee': 850.00,
                                'image_url': 'https://images.unsplash.com/photo-1594824813565-d011119b9322?auto=format&fit=crop&w=500&q=80',
                                'schedules': [
                                    (0, datetime.time(14, 0), datetime.time(18, 0), 30), # Mon
                                    (2, datetime.time(14, 0), datetime.time(18, 0), 30), # Wed
                                ]
                            }
                        ]
                    },
                    {
                        'name': 'Orthopedics',
                        'description': 'Bone, joint replacement, sports injury, and trauma surgery.',
                        'doctors': [
                            {
                                'name': 'Marcus Vance',
                                'specialization': 'Orthopedic & Joint Replacement Surgeon',
                                'email': 'dr.vance@citygeneral.org',
                                'phone': '+1-212-555-0148',
                                'experience_years': 12,
                                'consultation_fee': 700.00,
                                'image_url': 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=500&q=80',
                                'schedules': [
                                    (1, datetime.time(9, 0), datetime.time(13, 0), 30),
                                    (4, datetime.time(9, 0), datetime.time(13, 0), 30),
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                'name': 'Metro Heart & Multi-Specialty Hospital',
                'city': 'Chicago',
                'address': '200 E Randolph St, Chicago, IL 60601',
                'latitude': 41.8847,
                'longitude': -87.6200,
                'phone': '+1-312-555-0211',
                'email': 'contact@metroheartchicago.com',
                'image_url': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
                'departments': [
                    {
                        'name': 'Cardiology',
                        'description': 'Leading cardiac surgery, preventive cardiology, and intensive CCU services.',
                        'doctors': [
                            {
                                'name': 'James Wilson',
                                'specialization': 'Senior Cardiac Surgeon',
                                'email': 'dr.wilson@metroheart.com',
                                'phone': '+1-312-555-0212',
                                'experience_years': 22,
                                'consultation_fee': 900.00,
                                'image_url': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=500&q=80',
                                'schedules': [
                                    (0, datetime.time(9, 0), datetime.time(12, 0), 30),
                                    (3, datetime.time(9, 0), datetime.time(12, 0), 30),
                                ]
                            }
                        ]
                    },
                    {
                        'name': 'Pediatrics',
                        'description': 'Infant, child, and adolescent healthcare, immunizations, and developmental care.',
                        'doctors': [
                            {
                                'name': 'Maya Patel',
                                'specialization': 'Consultant Pediatrician',
                                'email': 'dr.patel@metroheart.com',
                                'phone': '+1-312-555-0213',
                                'experience_years': 8,
                                'consultation_fee': 500.00,
                                'image_url': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=500&q=80',
                                'schedules': [
                                    (0, datetime.time(10, 0), datetime.time(15, 0), 30),
                                    (1, datetime.time(10, 0), datetime.time(15, 0), 30),
                                    (2, datetime.time(10, 0), datetime.time(15, 0), 30),
                                    (3, datetime.time(10, 0), datetime.time(15, 0), 30),
                                    (4, datetime.time(10, 0), datetime.time(15, 0), 30),
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                'name': 'St. Jude Medical Center',
                'city': 'San Francisco',
                'address': '1001 Potrero Ave, San Francisco, CA 94110',
                'latitude': 37.7554,
                'longitude': -122.4046,
                'phone': '+1-415-555-0399',
                'email': 'care@stjudesf.org',
                'image_url': 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
                'departments': [
                    {
                        'name': 'Dermatology',
                        'description': 'Skin disorders, allergy diagnostics, aesthetic dermatology, and laser therapy.',
                        'doctors': [
                            {
                                'name': 'Claire Beauchamp',
                                'specialization': 'Consultant Dermatologist',
                                'email': 'dr.claire@stjudesf.org',
                                'phone': '+1-415-555-0391',
                                'experience_years': 11,
                                'consultation_fee': 650.00,
                                'image_url': 'https://images.unsplash.com/photo-1594824813565-d011119b9322?auto=format&fit=crop&w=500&q=80',
                                'schedules': [
                                    (1, datetime.time(9, 30), datetime.time(13, 30), 30),
                                    (3, datetime.time(9, 30), datetime.time(13, 30), 30),
                                    (5, datetime.time(9, 30), datetime.time(13, 30), 30), # Sat
                                ]
                            }
                        ]
                    },
                    {
                        'name': 'General Medicine',
                        'description': 'Internal medicine, adult health screenings, diabetes, and hypertension care.',
                        'doctors': [
                            {
                                'name': 'Alexander Wright',
                                'specialization': 'Internal Medicine Physician',
                                'email': 'dr.wright@stjudesf.org',
                                'phone': '+1-415-555-0392',
                                'experience_years': 15,
                                'consultation_fee': 550.00,
                                'image_url': 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=500&q=80',
                                'schedules': [
                                    (0, datetime.time(8, 30), datetime.time(12, 30), 30),
                                    (2, datetime.time(8, 30), datetime.time(12, 30), 30),
                                    (4, datetime.time(8, 30), datetime.time(12, 30), 30),
                                ]
                            }
                        ]
                    }
                ]
            }
        ]

        total_doctors = 0
        total_slots = 0

        for h_data in hospitals_data:
            departments = h_data.pop('departments')
            hospital, _ = Hospital.objects.update_or_create(
                name=h_data['name'],
                defaults=h_data
            )
            self.stdout.write(f"Hospital: {hospital.name} ({hospital.city})")

            for dept_data in departments:
                doctors = dept_data.pop('doctors')
                department, _ = Department.objects.update_or_create(
                    hospital=hospital,
                    name=dept_data['name'],
                    defaults={'description': dept_data['description']}
                )

                for doc_data in doctors:
                    schedules = doc_data.pop('schedules')
                    doctor, _ = Doctor.objects.update_or_create(
                        department=department,
                        name=doc_data['name'],
                        defaults=doc_data
                    )
                    total_doctors += 1

                    # Add schedules
                    for sched in schedules:
                        day_of_week, start_time, end_time, duration = sched
                        DoctorSchedule.objects.update_or_create(
                            doctor=doctor,
                            day_of_week=day_of_week,
                            start_time=start_time,
                            end_time=end_time,
                            defaults={'slot_duration_minutes': duration}
                        )

                    # Generate slots for next 30 days
                    slots_count = generate_slots_for_doctor(doctor, days_ahead=30)
                    total_slots += slots_count

        self.stdout.write(self.style.SUCCESS(f"Seeded {total_doctors} doctors and generated {total_slots} slots across 30 days!"))

        # 3. Create Sample Initial Booking for Alice Jenkins
        sample_slot = AppointmentSlot.objects.filter(
            status=AppointmentSlot.STATUS_AVAILABLE
        ).first()

        if sample_slot:
            sample_slot.status = AppointmentSlot.STATUS_BOOKED
            sample_slot.save()

            booking, _ = Booking.objects.get_or_create(
                user=patient1,
                slot=sample_slot,
                defaults={
                    'doctor': sample_slot.doctor,
                    'hospital': sample_slot.doctor.department.hospital,
                    'status': Booking.STATUS_CONFIRMED,
                    'payment_id': 'pay_seed_sample_01',
                    'payment_status': Booking.PAYMENT_SUCCESS,
                    'amount_paid': sample_slot.doctor.consultation_fee,
                    'patient_name': patient1.name,
                    'patient_phone': patient1.phone,
                    'notes': 'Initial routine health checkup consultation.',
                }
            )

            # Add confirmation notification
            Notification.objects.get_or_create(
                booking=booking,
                type=Notification.TYPE_CONFIRMATION,
                defaults={
                    'scheduled_at': timezone.now(),
                    'sent_at': timezone.now(),
                    'status': Notification.STATUS_SENT,
                    'recipient_email': patient1.email,
                }
            )
            self.stdout.write(self.style.SUCCESS(f"Created sample booking #{booking.id} for {patient1.email}"))

        self.stdout.write(self.style.SUCCESS('Turna database seeding completed successfully!'))
