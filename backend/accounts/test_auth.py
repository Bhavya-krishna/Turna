from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='testuser@turna.health',
            password='TestPassword123!',
            name='Test User',
            phone='+15551234567'
        )

    def test_register_user_success(self):
        payload = {
            'email': 'newuser@turna.health',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'name': 'New Patient',
            'phone': '+15559876543'
        }
        response = self.client.post('/api/auth/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertEqual(response.data['user']['email'], 'newuser@turna.health')

    def test_register_password_mismatch(self):
        payload = {
            'email': 'mismatch@turna.health',
            'password': 'SecurePassword123!',
            'password_confirm': 'DifferentPassword123!',
            'name': 'Mismatch Patient',
        }
        response = self.client.post('/api/auth/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        payload = {
            'email': 'testuser@turna.health',
            'password': 'TestPassword123!'
        }
        response = self.client.post('/api/auth/login/', payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], 'testuser@turna.health')

    def test_login_invalid_credentials(self):
        payload = {
            'email': 'testuser@turna.health',
            'password': 'WrongPassword123!'
        }
        response = self.client.post('/api/auth/login/', payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_current_user_profile(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'testuser@turna.health')
        self.assertEqual(response.data['name'], 'Test User')
