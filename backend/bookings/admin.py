from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'doctor', 'hospital', 'get_slot_date', 'status', 'payment_status', 'created_at')
    list_filter = ('status', 'payment_status', 'hospital', 'created_at')
    search_fields = ('user__email', 'doctor__name', 'hospital__name', 'payment_id')
    readonly_fields = ('created_at', 'updated_at')

    @admin.display(description='Appointment Date')
    def get_slot_date(self, obj):
        return f"{obj.slot.date} ({obj.slot.start_time.strftime('%H:%M')})"
