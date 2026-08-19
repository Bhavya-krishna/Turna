from django.urls import path
from .views import (
    HospitalListView,
    HospitalDetailView,
    HospitalDepartmentsView,
    DepartmentDetailView,
)

urlpatterns = [
    path('hospitals/', HospitalListView.as_view(), name='hospital-list'),
    path('hospitals/<int:pk>/', HospitalDetailView.as_view(), name='hospital-detail'),
    path('hospitals/<int:pk>/departments/', HospitalDepartmentsView.as_view(), name='hospital-departments'),
    path('departments/<int:pk>/', DepartmentDetailView.as_view(), name='department-detail'),
]
