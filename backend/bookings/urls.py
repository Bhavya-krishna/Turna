from django.urls import path
from .views import (
    InitiatePaymentView,
    BookingCreateView,
    UserBookingsListView,
    BookingDetailView,
    BookingCancelView,
)

urlpatterns = [
    path('bookings/initiate-payment/', InitiatePaymentView.as_view(), name='booking-initiate-payment'),
    path('bookings/', BookingCreateView.as_view(), name='booking-create'),
    path('users/me/bookings/', UserBookingsListView.as_view(), name='user-bookings-list'),
    path('bookings/<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('bookings/<int:pk>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
]
