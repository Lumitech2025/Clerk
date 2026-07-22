from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import AllowAny


class CCISTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Inject custom RBAC claims directly from the model field
        token['username'] = user.username
        token['email'] = user.email
        token['full_name'] = user.get_full_name()
        token['designation'] = user.designation 
        token['department_name'] = user.department_name or ''
        token['is_administrative'] = user.is_administrative_user

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Explicit user dictionary returned in the login JSON response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'phone_number': self.user.phone_number or '',
            'designation': self.user.designation,  # FIXED: maps to user.designation
            'department_name': self.user.department_name or '',
            'is_odpc_consented': self.user.is_odpc_consented,
            'is_administrative': self.user.is_administrative_user,
        }

        return data


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