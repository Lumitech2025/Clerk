from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from authentication.views import CCISLoginView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication Endpoints
    path('api/v1/auth/login/', CCISLoginView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
]