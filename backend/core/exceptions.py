from rest_framework import status
from rest_framework.exceptions import APIException


class SlotUnavailableConflictException(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'The requested appointment slot is no longer available.'
    default_code = 'slot_conflict'
