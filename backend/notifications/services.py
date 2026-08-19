import logging
from abc import ABC, abstractmethod
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


class BaseNotificationService(ABC):
    """
    Abstract Base Class for Notification Services.
    Allows swappable implementations (Console/SMTP, SendGrid, Twilio SMS, WhatsApp, etc.)
    """

    @abstractmethod
    def send_booking_confirmation(self, booking) -> bool:
        pass

    @abstractmethod
    def send_appointment_reminder(self, booking) -> bool:
        pass


class EmailNotificationService(BaseNotificationService):
    """
    Email-based notification service. Uses Django's configured EMAIL_BACKEND.
    In development/demo, this sends formatted emails to stdout console logs.
    """

    def send_booking_confirmation(self, booking) -> bool:
        user = booking.user
        doctor = booking.doctor
        hospital = booking.hospital
        slot = booking.slot

        subject = f"Appointment Confirmed: Dr. {doctor.name} at {hospital.name} [Turna]"
        body = (
            f"Dear {user.name or user.email},\n\n"
            f"Your hospital appointment has been successfully confirmed!\n\n"
            f"=== APPOINTMENT DETAILS ===\n"
            f"Booking ID: #{booking.id}\n"
            f"Hospital: {hospital.name} ({hospital.city})\n"
            f"Address: {hospital.address}\n"
            f"Department: {doctor.department.name}\n"
            f"Doctor: Dr. {doctor.name} ({doctor.specialization})\n"
            f"Date: {slot.date.strftime('%A, %B %d, %Y')}\n"
            f"Time: {slot.start_time.strftime('%I:%M %p')} - {slot.end_time.strftime('%I:%M %p')}\n"
            f"Payment ID: {booking.payment_id or 'N/A'}\n"
            f"Status: {booking.status}\n\n"
            f"Please arrive 15 minutes before your scheduled appointment time.\n"
            f"A reminder notification will be dispatched 30 minutes before your slot.\n\n"
            f"Thank you for choosing Turna — Your Time. Your Turn.\n"
        )

        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info(f"Booking confirmation email dispatched for booking #{booking.id} to {user.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send confirmation email for booking #{booking.id}: {e}")
            return False

    def send_appointment_reminder(self, booking) -> bool:
        user = booking.user
        doctor = booking.doctor
        hospital = booking.hospital
        slot = booking.slot

        subject = f"Reminder: Upcoming Appointment with Dr. {doctor.name} in 30 minutes [Turna]"
        body = (
            f"Dear {user.name or user.email},\n\n"
            f"This is a reminder that your hospital appointment is scheduled to begin in approximately 30 minutes!\n\n"
            f"=== APPOINTMENT DETAILS ===\n"
            f"Booking ID: #{booking.id}\n"
            f"Hospital: {hospital.name}\n"
            f"Doctor: Dr. {doctor.name}\n"
            f"Appointment Time: {slot.start_time.strftime('%I:%M %p')} today ({slot.date})\n\n"
            f"Please ensure you are at the consultation desk.\n\n"
            f"— Turna Health System\n"
        )

        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info(f"30-minute reminder email sent for booking #{booking.id} to {user.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send reminder email for booking #{booking.id}: {e}")
            return False


def get_notification_service() -> BaseNotificationService:
    """
    Factory function returning the configured notification service implementation.
    """
    return EmailNotificationService()
