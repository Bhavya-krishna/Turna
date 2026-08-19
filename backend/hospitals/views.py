from django.db.models import Count, Q
from rest_framework import generics, permissions
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from .models import Hospital, Department
from .serializers import HospitalListSerializer, HospitalDetailSerializer, DepartmentSerializer


class HospitalListView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = HospitalListSerializer

    def get_queryset(self):
        queryset = Hospital.objects.annotate(
            departments_count=Count('departments', distinct=True),
            doctors_count=Count('departments__doctors', filter=Q(departments__doctors__is_active=True), distinct=True),
        ).order_by('name')

        search = self.request.query_params.get('search', '').strip()
        city = self.request.query_params.get('city', '').strip()

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(city__icontains=search) |
                Q(address__icontains=search)
            )

        if city:
            queryset = queryset.filter(city__iexact=city)

        return queryset

    @extend_schema(
        summary="List hospitals",
        description="Fetch a list of hospitals with optional search by keyword or city filtering.",
        parameters=[
            OpenApiParameter(name='search', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Search by hospital name or city'),
            OpenApiParameter(name='city', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description='Filter by city name'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class HospitalDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Hospital.objects.prefetch_related('departments').all()
    serializer_class = HospitalDetailSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    @extend_schema(summary="Get hospital details", description="Retrieve hospital details with departments.")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class HospitalDepartmentsView(generics.ListAPIView):
    serializer_class = DepartmentSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        hospital_id = self.kwargs.get('pk')
        return Department.objects.filter(hospital_id=hospital_id).annotate(
            doctors_count=Count('doctors', filter=Q(doctors__is_active=True))
        ).order_by('name')

    @extend_schema(summary="List departments in a hospital")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class DepartmentDetailView(generics.RetrieveAPIView):
    queryset = Department.objects.select_related('hospital').annotate(
        doctors_count=Count('doctors', filter=Q(doctors__is_active=True))
    )
    serializer_class = DepartmentSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    @extend_schema(summary="Get department details")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
