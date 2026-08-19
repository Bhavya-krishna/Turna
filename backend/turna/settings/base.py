import os
import sys
from pathlib import Path
from datetime import timedelta
import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DJANGO_DEBUG=(bool, True),
    DJANGO_ALLOWED_HOSTS=(list, ['*']),
    CORS_ALLOWED_ORIGINS=(list, ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000']),
    CORS_ALLOW_ALL_ORIGINS=(bool, True),
    DATABASE_URL=(str, ''),
    REDIS_URL=(str, 'redis://localhost:6379/0'),
    EMAIL_BACKEND=(str, 'django.core.mail.backends.console.EmailBackend'),
    DEFAULT_FROM_EMAIL=(str, 'noreply@turna.health'),
    ADMIN_EMAIL=(str, 'admin@turna.health'),
    RAZORPAY_KEY_ID=(str, 'rzp_test_key'),
    RAZORPAY_KEY_SECRET=(str, 'rzp_test_secret'),
    RAZORPAY_MOCK_MODE=(bool, True),
)

# Read .env file if it exists
env_file = BASE_DIR / '.env'
if env_file.exists():
    environ.Env.read_env(str(env_file))

SECRET_KEY = env('DJANGO_SECRET_KEY', default='django-insecure-turna-development-key-default-!@#$')
DEBUG = env('DJANGO_DEBUG')
ALLOWED_HOSTS = env('DJANGO_ALLOWED_HOSTS')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',

    # Local apps
    'accounts.apps.AccountsConfig',
    'hospitals.apps.HospitalsConfig',
    'doctors.apps.DoctorsConfig',
    'bookings.apps.BookingsConfig',
    'notifications.apps.NotificationsConfig',
    'core.apps.CoreConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'turna.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'turna.wsgi.application'
ASGI_APPLICATION = 'turna.asgi.application'

# Database configuration: PostgreSQL with auto fallback to SQLite
database_url = env('DATABASE_URL')
if database_url:
    DATABASES = {
        'default': env.db_url('DATABASE_URL')
    }
else:
    # Check if separate postgres env vars are provided
    pg_db = os.environ.get('POSTGRES_DB')
    pg_user = os.environ.get('POSTGRES_USER')
    pg_pass = os.environ.get('POSTGRES_PASSWORD')
    pg_host = os.environ.get('DATABASE_HOST')
    pg_port = os.environ.get('DATABASE_PORT', '5432')

    if pg_db and pg_host:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': pg_db,
                'USER': pg_user or 'postgres',
                'PASSWORD': pg_pass or 'postgres',
                'HOST': pg_host,
                'PORT': pg_port,
                'CONN_MAX_AGE': 60,
            }
        }
    else:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS
CORS_ALLOW_ALL_ORIGINS = env('CORS_ALLOW_ALL_ORIGINS')
CORS_ALLOWED_ORIGINS = env('CORS_ALLOWED_ORIGINS')
CORS_ALLOW_CREDENTIALS = True

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# Simple JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# drf-spectacular OpenAPI documentation
SPECTACULAR_SETTINGS = {
    'TITLE': 'Turna API — Your Time. Your Turn.',
    'DESCRIPTION': 'Production-ready REST API for Turna Hospital Appointment Booking Platform.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}

# Celery Configuration
IS_TESTING = 'test' in sys.argv or 'pytest' in sys.modules or os.environ.get('PYTEST_CURRENT_TEST') is not None
IS_SQLITE = 'sqlite' in DATABASES['default']['ENGINE']
CELERY_TASK_ALWAYS_EAGER = env.bool('CELERY_TASK_ALWAYS_EAGER', default=IS_TESTING or IS_SQLITE)
CELERY_TASK_EAGER_PROPAGATES = True
REDIS_URL = env('REDIS_URL')
CELERY_BROKER_URL = 'memory://' if CELERY_TASK_ALWAYS_EAGER else env('CELERY_BROKER_URL', default=REDIS_URL)
CELERY_RESULT_BACKEND = 'cache+memory://' if CELERY_TASK_ALWAYS_EAGER else env('CELERY_RESULT_BACKEND', default=REDIS_URL)
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Celery Beat Schedule
CELERY_BEAT_SCHEDULE = {
    'generate-doctor-slots-daily': {
        'task': 'doctors.tasks.generate_all_doctor_slots_task',
        'schedule': 86400.0, # Every 24 hours
        'kwargs': {'days': 30},
    },
}

# Email / Notifications
EMAIL_BACKEND = env('EMAIL_BACKEND')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL')
ADMIN_EMAIL = env('ADMIN_EMAIL')

# Razorpay Configuration
RAZORPAY_KEY_ID = env('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = env('RAZORPAY_KEY_SECRET')
RAZORPAY_MOCK_MODE = env('RAZORPAY_MOCK_MODE')
