from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'type', 'scheduled_at', 'sent_at', 'status', 'celery_task_id', 'created_at')
    list_filter = ('type', 'status', 'scheduled_at')
    search_fields = ('booking__id', 'booking__user__email', 'celery_task_id')
    readonly_fields = ('created_at',)
