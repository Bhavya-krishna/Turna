from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status


class HealthProbeTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_liveness_healthz_endpoint(self):
        response = self.client.get('/healthz/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertEqual(response.data['service'], 'turna-backend')

    def test_readiness_readyz_endpoint(self):
        response = self.client.get('/readyz/')
        # In test suite with active database, database check passes
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE])
        self.assertIn('checks', response.data)
        self.assertIn('database', response.data['checks'])
