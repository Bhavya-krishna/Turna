import logging
from celery import shared_task
from django.utils import timezone
from .models import Notification
from .services import get_notification_service

logger = logging.getLogger(__name__)


@shared_task(name='notifications.tasks.send_appointment_reminder_task')
def send_appointment_reminder_task(notification_id: int):
    """
    Celery task to dispatch an appointment reminder 30 minutes before appointment start time.
    """
    try:
        notification = Notification.objects.select_related(
            'booking', 'booking__user', 'booking__doctor', 'booking__doctor__department',
            'booking__hospital', 'booking__slot'
        ).get(id=notification_id)
    except Notification.DoesNotExist:
        logger.warning(f"Notification with id {notification_id} not found.")
        return False

    booking = notification.booking

    # Check if booking was cancelled in the meantime
    if booking.status != 'CONFIRMED':
        logger.info(f"Skipping reminder for booking #{booking.id} because status is {booking.status}.")
        notification.status = Notification.STATUS_CANCELLED
        notification.save()
        return False

    service = get_notification_service()
    success = service.send_appointment_reminder(booking)

    if success:
        notification.status = Notification.STATUS_SENT
        notification.sent_at = timezone.now()
    else:
        notification.status = Notification.STATUS_FAILED

    notification.save()
    return success
