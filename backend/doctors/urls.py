from django.urls import path
from .views import (
    DoctorListView,
    DepartmentDoctorsView,
    DoctorDetailView,
    DoctorSlotsView,
    DoctorScheduleCreateView,
    BlockSlotView,
)

urlpatterns = [
    path('doctors/', DoctorListView.as_view(), name='doctor-list'),
    path('departments/<int:pk>/doctors/', DepartmentDoctorsView.as_view(), name='department-doctors'),
    path('doctors/<int:pk>/', DoctorDetailView.as_view(), name='doctor-detail'),
    path('doctors/<int:pk>/slots/', DoctorSlotsView.as_view(), name='doctor-slots'),
    path('doctors/<int:pk>/schedule/', DoctorScheduleCreateView.as_view(), name='doctor-schedule-create'),
    path('slots/<int:pk>/block/', BlockSlotView.as_view(), name='slot-block'),
]
