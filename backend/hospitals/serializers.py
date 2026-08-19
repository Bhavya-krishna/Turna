from rest_framework import serializers
from .models import Hospital, Department


class DepartmentSerializer(serializers.ModelSerializer):
    doctors_count = serializers.IntegerField(read_only=True, default=0)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)

    class Meta:
        model = Department
        fields = ('id', 'hospital', 'hospital_name', 'name', 'description', 'doctors_count', 'created_at')
        read_only_fields = ('id', 'created_at')


class HospitalListSerializer(serializers.ModelSerializer):
    departments_count = serializers.IntegerField(read_only=True, default=0)
    doctors_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Hospital
        fields = (
            'id', 'name', 'address', 'city', 'latitude', 'longitude',
            'phone', 'email', 'image_url', 'departments_count', 'doctors_count', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class HospitalDetailSerializer(serializers.ModelSerializer):
    departments = DepartmentSerializer(many=True, read_only=True)

    class Meta:
        model = Hospital
        fields = (
            'id', 'name', 'address', 'city', 'latitude', 'longitude',
            'phone', 'email', 'image_url', 'departments', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
