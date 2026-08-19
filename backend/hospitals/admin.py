from django.contrib import admin
from .models import Hospital, Department


class DepartmentInline(admin.TabularInline):
    model = Department
    extra = 1


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'city', 'phone', 'email', 'created_at')
    list_filter = ('city',)
    search_fields = ('name', 'city', 'address')
    inlines = [DepartmentInline]


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'hospital', 'created_at')
    list_filter = ('hospital__city', 'hospital')
    search_fields = ('name', 'hospital__name')
