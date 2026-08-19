from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from core.views import LivenessHealthCheckView, ReadinessHealthCheckView

urlpatterns = [
    # Health Probes (OpenShift & K8s)
    path('healthz/', LivenessHealthCheckView.as_view(), name='healthz'),
    path('readyz/', ReadinessHealthCheckView.as_view(), name='readyz'),

    # Admin Panel
    path('admin/', admin.site.urls),

    # API Documentation (Swagger & OpenAPI Schema)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Application APIs
    path('api/auth/', include('accounts.urls')),
    path('api/', include('hospitals.urls')),
    path('api/', include('doctors.urls')),
    path('api/', include('bookings.urls')),
]
