from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _


class BaptismRecord(models.Model):
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
    ]

    STATUS_CHOICES = [
        ('Processing', 'Processing'),
        ('Certificate Ready', 'Certificate Ready'),
        ('Pending Collection', 'Pending Collection'),
        ('Certificate Collected', 'Certificate Collected'),
    ]

    # Candidate Information
    full_name = models.CharField(max_length=255)
    dob = models.DateField(verbose_name="Date of Birth")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$', 
        message="Phone number must be entered in the format: '+254712345678'."
    )
    phone = models.CharField(validators=[phone_regex], max_length=17)
    email = models.EmailField(blank=True, null=True)

    # Baptism Ceremony Details
    officiating_pastor = models.CharField(max_length=255)
    baptism_date = models.DateField()
    place_of_baptism = models.CharField(max_length=255, default="Newlife Main Sanctuary")

    # Certificate & Tracking Status
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Processing')
    certificate_collected_at = models.DateTimeField(blank=True, null=True)
    
    # Optional relation if candidate is linked to an existing User/Member profile
    member_profile = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='baptism_certificate'
    )

    # Audit & RBAC Fields
    # FIXED: Replaced 'auth.User' string with settings.AUTH_USER_MODEL
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='recorded_baptisms'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-baptism_date']
        verbose_name = _("Baptism Record")
        verbose_name_plural = _("Baptism Register")

    def __str__(self):
        return f"{self.full_name} - {self.baptism_date}"
    


class ChildDedication(models.Model):
    STATUS_CHOICES = [
        ('Processing', 'Processing'),
        ('Certificate Ready', 'Certificate Ready'),
        ('Pending Collection', 'Pending Collection'),
        ('Certificate Collected', 'Certificate Collected'),
    ]

    child_name = models.CharField(_("Child's Full Name"), max_length=255)
    father_name = models.CharField(_("Father's Name"), max_length=255)
    mother_name = models.CharField(_("Mother's Name"), max_length=255)
    dob = models.DateField(_("Date of Birth"))
    phone = models.CharField(_("Parent Phone Number"), max_length=20)
    email = models.EmailField(_("Parent Email Address"), max_length=254, blank=True, null=True)
    dedication_date = models.DateField(_("Date of Dedication"))
    officiating_pastor = models.CharField(_("Officiating Pastor"), max_length=255)
    status = models.CharField(
        _("Status"), 
        max_length=30, 
        choices=STATUS_CHOICES, 
        default='Processing'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-dedication_date', '-created_at']
        verbose_name = _("Child Dedication")
        verbose_name_plural = _("Child Dedications")

    def __str__(self):
        return f"{self.child_name} - Dedicated {self.dedication_date}"