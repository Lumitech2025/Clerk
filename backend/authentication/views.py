from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import AllowAny

from django.contrib.auth import get_user_model

from .serializers import (
    UserAdminRegistrationSerializer, 
    CustomTokenObtainPairSerializer,
    CCISTokenObtainPairSerializer
)

User = get_user_model()



class CCISLoginView(TokenObtainPairView):
    """
    Primary Authentication Endpoint for CCIS.
    Returns JWT Access/Refresh tokens + User RBAC profile context.
    """
    permission_classes = [AllowAny]
    serializer_class = CCISTokenObtainPairSerializer
    serializer_class = CCISTokenObtainPairSerializer


# =====================================================================
# CUSTOM RBAC PERMISSION CLASSES FOR CCIS API ENDPOINTS
# =====================================================================

class IsChurchClerk(permissions.BasePermission):
    """Allows full access only to the Church Clerk desk."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated 
            and request.user.designation == 'CLERK'
        )


class IsPastoralOrElder(permissions.BasePermission):
    """Allows access to Pastors and Elders (e.g., viewing confidential board minutes or member transfers)."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated 
            and request.user.designation in ['PASTOR', 'ELDER', 'CLERK']
        )


class IsAdministrativeStaff(permissions.BasePermission):
    """Allows access across all 5 administrative roles (Clerk, Pastor, Elder, Communication, Dept Leader)."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated 
            and request.user.is_administrative_user
        )
    
class IsCommunicationTeam(permissions.BasePermission):
    """Access for Church Communication desk (e.g., announcements, bulletins)."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated 
            and request.user.designation in ['COMMUNICATION', 'CLERK']
        )

class IsDepartmentLeader(permissions.BasePermission):
    """Access for Departmental Leaders (e.g., submitting TOR reports, requisition logs)."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated 
            and request.user.designation in ['DEPT_LEADER', 'CLERK']
        )

class IsChurchMember(permissions.BasePermission):
    """Base access for general church members (read-only announcements, transfer requests)."""
    def has_permission(self, request, view):
        return request.user.is_authenticated


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing church officials and user accounts.
    Allows Church Clerks and Admins to list and create users.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserAdminRegistrationSerializer
    
    # Restrict user management endpoints strictly to Church Clerks / Administrative Staff
    permission_classes = [IsChurchClerk]

    def get_serializer_class(self):
        return UserAdminRegistrationSerializer