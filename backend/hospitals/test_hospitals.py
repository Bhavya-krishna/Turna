from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from hospitals.models import Hospital, Department


class HospitalTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.hospital1 = Hospital.objects.create(
            name='City General Hospital',
            city='New York',
            address='123 5th Ave',
            phone='+12125550100'
        )
        self.hospital2 = Hospital.objects.create(
            name='Metro Care Hospital',
            city='Chicago',
            address='456 Michigan Ave',
            phone='+13125550200'
        )
        self.dept1 = Department.objects.create(
            hospital=self.hospital1,
            name='Cardiology',
            description='Heart and vascular care'
        )
        self.dept2 = Department.objects.create(
            hospital=self.hospital1,
            name='Neurology',
            description='Brain and nerve care'
        )

    def test_list_hospitals(self):
        response = self.client.get('/api/hospitals/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_filter_hospitals_by_city(self):
        response = self.client.get('/api/hospitals/?city=New York')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'City General Hospital')

    def test_search_hospitals(self):
        response = self.client.get('/api/hospitals/?search=Metro')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Metro Care Hospital')

    def test_hospital_detail_with_departments(self):
        response = self.client.get(f'/api/hospitals/{self.hospital1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'City General Hospital')
        self.assertEqual(len(response.data['departments']), 2)

    def test_hospital_departments_endpoint(self):
        response = self.client.get(f'/api/hospitals/{self.hospital1.id}/departments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
