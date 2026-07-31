# authentication/permissions.py

from rest_framework import permissions

def get_user_role(user) -> str:
    """
    Centralized helper: Safely extracts and normalizes user designation/role to UPPERCASE.
    """
    if not user or not user.is_authenticated:
        return ""
    
    role = (
        getattr(user, 'designation', None) 
        or getattr(user, 'role', None) 
        or getattr(getattr(user, 'profile', None), 'role', '')
    )
    return str(role).strip().upper()


class IsChurchClerk(permissions.BasePermission):
    """Full CRUD access granted strictly to Church Clerks and Superusers."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return get_user_role(request.user) in ['CLERK', 'CHURCH_CLERK']


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
        if role in ['CLERK', 'CHURCH_CLERK']:
            return True
        if request.method in permissions.SAFE_METHODS and role in ['PASTOR', 'ELDER']:
            return True
        return False


class IsCommunicationOrClerk(permissions.BasePermission):
    """Access for managing Bulletins and Public Church Announcements."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        role = get_user_role(request.user)
        if request.method in permissions.SAFE_METHODS:
            return True
        return role in ['CLERK', 'CHURCH_CLERK', 'COMMUNICATION']


class IsClerkOrPastorOrElder(permissions.BasePermission):
    """Access for Church Clerks, Pastors, Elders, and Admins."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        role = get_user_role(request.user)
        allowed = ['CLERK', 'CHURCH_CLERK', 'PASTOR', 'ELDER', 'ADMIN']
        return role in allowed or request.user.groups.filter(name__iregex=r'^(clerk|pastor|elder|admin)s?$').exists()


class DepartmentalReportPermission(permissions.BasePermission):
    """Access policy for Departmental Reports."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        role = get_user_role(request.user)

        if request.method == 'POST':
            return request.user.is_superuser or role in [
                'CLERK', 'CHURCH_CLERK', 'PASTOR', 'ELDER', 
                'DEPARTMENT_LEADER', 'DEPT_LEADER'
            ]

        if request.method in ['PUT', 'PATCH', 'DELETE']:
            return request.user.is_superuser or role in ['CLERK', 'CHURCH_CLERK', 'PASTOR']

        return False


class CanManageDepartmentEvents(permissions.BasePermission):
    """Permission for managing departmental events."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        user_role = get_user_role(request.user)
        allowed_roles = ['CLERK', 'CHURCH_CLERK', 'PASTOR', 'ELDER', 'DEPT_LEADER', 'DEPARTMENT_LEADER', 'COMMUNICATION', 'ADMIN']
        return user_role in allowed_roles


class IsDepartmentLeaderOrLeadershipForMeeting(permissions.BasePermission):
    """RBAC Permission for Departmental Meetings."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if request.method in permissions.SAFE_METHODS:
            return True

        role = get_user_role(request.user)
        return role in ['CLERK', 'CHURCH_CLERK', 'PASTOR', 'ELDER', 'DEPARTMENT_LEADER', 'DEPT_LEADER', 'ADMIN']


class RoleBasedEventAccessPermission(permissions.BasePermission):
    """Access for General Church Events."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        user = request.user
        user_role = get_user_role(user)
        
        return user.is_staff or user.is_superuser or user_role in ['CLERK', 'CHURCH_CLERK', 'PASTOR']