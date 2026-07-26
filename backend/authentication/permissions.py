# authentication/permissions.py

from rest_framework.permissions import SAFE_METHODS, BasePermission
from authentication.models import User

class IsChurchClerk(BasePermission):
    """Grants access strictly to the Church Clerk administrative role."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        if request.method in SAFE_METHODS:
            return True

        return request.user.designation in [
            User.Designation.CLERK, 
            User.Designation.PASTOR
        ]
        

class IsPastoralTeam(BasePermission):
    """Grants access to Pastors and Church Elders."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.designation in [User.Designation.PASTOR, User.Designation.ELDER, User.Designation.CLERK]
        )

class IsBoardMember(BasePermission):
    """Grants access to Board Members (Clerk, Pastors, Elders, Department Leaders)."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.is_administrative_user
        )