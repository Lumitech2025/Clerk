import os
from pathlib import Path
import environ
from datetime import timedelta
from django.conf.urls.static import static

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# 1. Initialize environment parser
env = environ.Env(
    DEBUG=(bool, False)
)

# 2. Define BASE_DIR (points to project root)
BASE_DIR = Path(__file__).resolve().parent.parent


# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


# 3. Explicitly read the .env file located at BASE_DIR / '.env'
env_file = os.path.join(BASE_DIR, '.env')
if os.path.exists(env_file):
    environ.Env.read_env(env_file)

# 4. Environment Variables
SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', default=True)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['127.0.0.1', 'localhost'])

# 5. Auth User & REST Framework Configurations
AUTH_USER_MODEL = 'authentication.User'


# settings.py

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # Throttle / Rate Limiting Configurations
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',          # Unauthenticated general users
        'user': '2000/day',         # Authenticated members/clerks
        'login': '5/minute',        # Strict limit for authentication endpoint
        'refresh': '10/minute',     # Limit for token refresh requests
    }
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# 6. Installed Applications
INSTALLED_APPS = [
    # 1. Admin Theme Customization (Must precede django.contrib.admin)
    'jazzmin',

    'axes', 

    # Default Django Apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-Party Packages
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',

    # CCIS Local Apps
    'authentication',
    'core',
]

# 7. Middleware Chain (CORS added)
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'axes.middleware.AxesMiddleware'
]

# CORS Permissions & Credentials Configuration
CORS_ALLOW_CREDENTIALS = True  # Required for HttpOnly cookies

CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
])

# Secure Cookie & Browser Security Headers
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# 8. Database Engine (PostgreSQL)
DATABASES = {
    'default': env.db_url(
        'DATABASE_URL', 
        default=f"postgres://{env('DB_USER', default='postgres')}:{env('DB_PASSWORD', default='')}@{env('DB_HOST', default='localhost')}:{env('DB_PORT', default='5432')}/{env('DB_NAME', default='clerk')}"
    )
}

# 9. Redis Cache Setup
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": env("REDIS_URL", default="redis://127.0.0.1:6379/1"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

if DEBUG:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "ccis-local-dev-cache",
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": env("REDIS_URL", default="redis://127.0.0.1:6379/1"),
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "IGNORE_EXCEPTIONS": True,  # Prevents crashing if Redis drops in prod
            }
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi' 
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesBackend',  # Must be first
    'django.contrib.auth.backends.ModelBackend',
]

AXES_FAILURE_LIMIT = 5                     
AXES_COOLOFF_TIME = 0.5                     
AXES_RESET_ON_SUCCESS = True                
AXES_LOCKOUT_TEMPLATE = None  



HTTPSMS_API_KEY = os.getenv('HTTPSMS_API_KEY')
HTTPSMS_SENDER_PHONE = os.getenv('HTTPSMS_SENDER_PHONE')

JAZZMIN_SETTINGS = {
    "site_title": "Newlife CCIS Admin",
    "site_header": "Newlife Church Clerk Desk",
    "site_brand": "Newlife CCIS",
    "welcome_sign": "Welcome to Newlife Church Clerk Information System",
    "copyright": "Newlife SDA Church - Office of the Church Clerk",
    "search_model": ["authentication.User", "memberships.MembershipRegister"],
    
    "user_avatar": None,
    "topmenu_links": [
        {"name": "Home",  "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "Clerk Desk Dashboard", "url": "/api/v1/clerk/dashboard/", "new_window": True},
    ],

    "hide_models": [
        "core.MeetingAttendance",
        "core.AbsenceApology",
        "core.AttendanceSheetUpload",
    ],

    "order_with_respect_to": [
        "core.MemberRecord",
        "core.Meeting",
        "core.Department",
        "core.DepartmentalReport",
        "core.BaptismRecord",
        "core.ChildDedication",
        "core.Bulletin",
    ],
    
    "show_sidebar": True,
    "navigation_expanded": True,
    "hide_apps": [],
    "icons": {
        "authentication.User": "fas fa-user-shield",
        "memberships.MembershipRegister": "fas fa-users",
    },
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-navy",
    "accent": "accent-primary",
    "navbar": "navbar-dark navbar-navy",
    "no_navbar_border": False,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-navy",
    "sidebar_nav_small_text": False,
    "theme": "flatly",
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success"
    }
}