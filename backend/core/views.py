import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import connection
from django.conf import settings
import redis
from drf_spectacular.utils import extend_schema, OpenApiResponse

logger = logging.getLogger(__name__)


class LivenessHealthCheckView(APIView):
    """
    Lightweight health check endpoint for Kubernetes/OpenShift liveness probes.
    MUST NOT depend on database or external services.
    """
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        summary="Liveness Health Check (/healthz/)",
        description="Returns 200 OK if the application server process is running. Used for liveness probes.",
        responses={200: OpenApiResponse(description="Application is alive")}
    )
    def get(self, request):
        return Response({
            'status': 'healthy',
            'service': 'turna-backend',
            'checks': {
                'server': 'ok',
            }
        }, status=status.HTTP_200_OK)


class ReadinessHealthCheckView(APIView):
    """
    Readiness probe endpoint for Kubernetes/OpenShift.
    Verifies database and Redis connectivity.
    """
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        summary="Readiness Health Check (/readyz/)",
        description="Checks database and Redis connectivity. Returns 200 if ready, 503 if any service is down.",
        responses={
            200: OpenApiResponse(description="All dependencies healthy and ready"),
            503: OpenApiResponse(description="Service unavailable due to dependency failure"),
        }
    )
    def get(self, request):
        checks = {}
        all_healthy = True

        # 1. Check Database
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
            checks['database'] = 'ok'
        except Exception as e:
            logger.error(f"Database readiness check failed: {e}")
            checks['database'] = f"failed: {str(e)}"
            all_healthy = False

        # 2. Check Redis / Celery broker
        try:
            redis_url = getattr(settings, 'REDIS_URL', 'redis://localhost:6379/0')
            r = redis.from_url(redis_url, socket_connect_timeout=2)
            r.ping()
            checks['redis'] = 'ok'
        except Exception as e:
            # If redis is optional in local standalone mode, we note warning
            logger.warning(f"Redis readiness check warning: {e}")
            checks['redis'] = f"warning: {str(e)}"
            # In strict environments, redis failure marks unready
            # Let's keep it healthy if database works and redis is local
            if 'localhost' not in getattr(settings, 'REDIS_URL', ''):
                all_healthy = False

        status_code = status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response({
            'status': 'ready' if all_healthy else 'unready',
            'service': 'turna-backend',
            'checks': checks
        }, status=status_code)
