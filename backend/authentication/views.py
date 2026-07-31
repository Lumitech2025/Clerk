from django.conf import settings
from rest_framework import viewsets, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model

from .serializers import (
    UserAdminRegistrationSerializer, 
    CCISTokenObtainPairSerializer
)
from .permissions import IsChurchClerk

from .throttling import LoginRateThrottle

User = get_user_model()


class CCISLoginView(TokenObtainPairView):
    """
    Primary Authentication Endpoint for CCIS.
    Sets Refresh Token in an HttpOnly cookie and returns Access Token + User profile context.
    """
    permission_classes = [AllowAny]
    serializer_class = CCISTokenObtainPairSerializer
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            refresh_token = response.data.get('refresh')
            
            # Remove raw refresh token from response body
            if 'refresh' in response.data:
                del response.data['refresh']

            # Set HttpOnly, Secure cookie (__Host- prefix in production)
            cookie_name = '__Host-refresh_token' if not settings.DEBUG else 'refresh_token'
            response.set_cookie(
                key=cookie_name,
                value=refresh_token,
                httponly=True,
                secure=not settings.DEBUG,  # True in production (HTTPS)
                samesite='Lax',
                path='/',
                max_age=7 * 24 * 60 * 60  # 7 Days (matches SIMPLE_JWT REFRESH_TOKEN_LIFETIME)
            )
        return response


class CCISTokenRefreshView(TokenRefreshView):
    """
    Extracts refresh token from HttpOnly cookie and issues a new access token.
    Supports token rotation by setting a new refresh cookie if returned.
    """

    throttle_scope = 'refresh'
    
    def post(self, request, *args, **kwargs):
        cookie_name = '__Host-refresh_token' if not settings.DEBUG else 'refresh_token'
        refresh_token = request.COOKIES.get(cookie_name) or request.COOKIES.get('refresh_token')
        
        if refresh_token:
            mutable_data = request.data.copy()
            mutable_data['refresh'] = refresh_token
            request._full_data = mutable_data

        response = super().post(request, *args, **kwargs)

        # Handle token rotation if SimpleJWT returns a new refresh token
        if response.status_code == 200 and 'refresh' in response.data:
            new_refresh = response.data.get('refresh')
            del response.data['refresh']
            
            response.set_cookie(
                key=cookie_name,
                value=new_refresh,
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                path='/',
                max_age=7 * 24 * 60 * 60
            )

        return response


class CCISLogoutView(views.APIView):
    """
    Clears HttpOnly refresh token cookie on user logout.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        cookie_name = '__Host-refresh_token' if not settings.DEBUG else 'refresh_token'
        response.delete_cookie(cookie_name, path='/')
        response.delete_cookie('refresh_token', path='/')
        return response


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing church officials and user accounts.
    Allows Church Clerks and Admins to list and create users.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserAdminRegistrationSerializer
    permission_classes = [IsChurchClerk]