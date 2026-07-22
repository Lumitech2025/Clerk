# authentication/permissions.py

from rest_framework.permissions import BasePermission
from authentication.models import User

class IsChurchClerk(BasePermission):
    """Grants access strictly to the Church Clerk administrative role."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.designation == User.Designation.CLERK
        )

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