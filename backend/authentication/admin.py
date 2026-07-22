from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom Django Admin configuration for the CCIS User model.
    Optimized for Jazzmin UI and Kenya Data Protection Act (ODPC) audit requirements.
    """

    # 1. Search and Filtering Performance
    search_fields = ('email', 'first_name', 'last_name', 'phone_number', 'department_name')
    list_filter = ('designation', 'is_staff', 'is_active', 'is_odpc_consented')
    ordering = ('-date_joined',)

    # 2. Admin List View Display
    list_display = (
        'email',
        'get_full_name_display',
        'phone_number',
        'designation_badge',
        'department_name',
        'is_staff',
        'date_joined',
    )
    
    list_select_related = True
    list_per_page = 25

    # 3. Form Fieldsets for Detailed/Edit View
    fieldsets = (
        (_('Authentication Credentials'), {
            'fields': ('email', 'password')
        }),
        (_('Personal Information'), {
            'fields': ('first_name', 'last_name', 'username', 'phone_number')
        }),
        (_('Role & Department'), {
            'description': _('Assign the primary role designation determining dashboard portal permissions.'),
            'fields': ('designation', 'department_name')
        }),
        
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',),
        }),
        
    )

    # 4. Add User View (Form shown when creating a user via Admin)
    add_fieldsets = (
        (_('Create New User'), {
            'classes': ('wide',),
            'fields': (
                'email',
                'username',
                'first_name',
                'last_name',
                'phone_number',
                'designation',
                'department_name',
                'password1',
                'password2',
            ),
        }),
    )

    # 5. Read-only fields for audit protection
    readonly_fields = ('date_joined', 'last_login', 'consent_date')

    # Custom Helper Methods for List Display
    @admin.display(description=_('Full Name'), ordering='last_name')
    def get_full_name_display(self, obj):
        return obj.get_full_name() or obj.username

    @admin.display(description=_('Designation Role'), ordering='designation')
    def designation_badge(self, obj):
        """Displays formatted designation name."""
        return obj.get_designation_display()