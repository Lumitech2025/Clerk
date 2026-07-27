from rest_framework import permissions

def get_user_role(user) -> str:
    """Safely extracts and normalizes user role string."""
    if not user or not user.is_authenticated:
        return ""
    role = getattr(user, 'role', '') or getattr(user, 'designation', '')
    return str(role).strip().lower()


class IsChurchClerk(permissions.BasePermission):
    """Full CRUD access granted strictly to Church Clerks and Superusers."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return get_user_role(request.user) == 'clerk'


class IsLeadershipReadOnlyOrClerkWrite(permissions.BasePermission):
    """
    - Write (POST, PUT, PATCH, DELETE): Strictly Clerk / Superuser.
    - Read (GET, HEAD, OPTIONS): Pastoral Team (Pastors, Elders) and Clerk.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        role = get_user_role(request.user)

        if request.method in permissions.SAFE_METHODS:
            return role in ['clerk', 'pastor', 'elder']

        return role == 'clerk'


class IsBoardMemberOrReadOnly(permissions.BasePermission):
    """
    Access policy for Departmental Reports & Meetings:
    - Write: Departmental Leaders, Communication, Clerk.
    - Read: Board Members (Clerk, Pastors, Elders, Department Leaders).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        role = get_user_role(request.user)
        board_roles = ['clerk', 'pastor', 'elder', 'department_leader', 'communication']

        if request.method in permissions.SAFE_METHODS:
            return role in board_roles

        return role in ['clerk', 'department_leader', 'communication']


class IsCommunicationOrClerk(permissions.BasePermission):
    """Access for managing Bulletins and Public Church Announcements."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        role = get_user_role(request.user)
        
        if request.method in permissions.SAFE_METHODS:
            return True # Bulletins are readable by all authenticated members
        
        return role in ['clerk', 'communication']