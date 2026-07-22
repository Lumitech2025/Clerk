# authentication/models.py

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    """
    Custom User model supporting Role-Based Access Control (RBAC)
    for the Newlife Church Clerk Information System (CCIS).
    """
    class Designation(models.TextChoices):
        CLERK = 'CLERK', _('Church Clerk')
        PASTOR = 'PASTOR', _('Pastor')
        ELDER = 'ELDER', _('Elder')
        COMMUNICATION = 'COMMUNICATION', _('Communication Officer')
        DEPT_LEADER = 'DEPT_LEADER', _('Departmental Leader')
        MEMBER = 'MEMBER', _('Church Member')

    # Primary Contact & Profile Fields
    email = models.EmailField(_('email address'), unique=True)
    phone_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    
    # Designation / Role Assignment
    designation = models.CharField(
        max_length=20,
        choices=Designation.choices,
        default=Designation.MEMBER,
        help_text=_('System role determining dashboard portal access level.')
    )

    # Departmental Scope (Optional binding for Departmental Leaders)
    department_name = models.CharField(
        max_length=100, 
        null=True, 
        blank=True,
        help_text=_('Assigned department if designation is Departmental Leader.')
    )

    # Compliance & Audit Flags (Kenya Data Protection Act / ODPC)
    is_odpc_consented = models.BooleanField(
        default=False,
        help_text=_('Indicates whether user consented to personal data processing.')
    )
    consent_date = models.DateTimeField(null=True, blank=True)

    # Use Email as the primary login identifier
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_designation_display()})"

    @property
    def is_administrative_user(self):
        """Returns True if user has any of the 5 administrative designations."""
        return self.designation in [
            self.Designation.CLERK,
            self.Designation.PASTOR,
            self.Designation.ELDER,
            self.Designation.COMMUNICATION,
            self.Designation.DEPT_LEADER,
        ]