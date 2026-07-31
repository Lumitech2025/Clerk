from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _
import os
from django.contrib.auth import get_user_model
import uuid
from django.core.exceptions import ValidationError
from django.dispatch import receiver
from django.db.models.signals import post_save


User = get_user_model()

def upload_baptism_docs(instance, filename):
    return os.path.join(f'baptism_docs/{instance.id or "temp"}/', filename)

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
    dob = models.DateField(verbose_name="Date of Birth", null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$', 
        message="Phone number format: '+254712345678'."
    )
    phone = models.CharField(validators=[phone_regex], max_length=17)
    email = models.EmailField(blank=True, null=True)

    # Parent / Guardian Details
    father_name = models.CharField(max_length=255, blank=True, null=True)
    father_phone = models.CharField(max_length=20, blank=True, null=True)
    mother_name = models.CharField(max_length=255, blank=True, null=True)
    mother_phone = models.CharField(max_length=20, blank=True, null=True)

    # Baptism Ceremony Details
    officiating_pastor = models.CharField(max_length=255)
    baptism_date = models.DateField()
    place_of_baptism = models.CharField(max_length=255, default="Newlife Main Sanctuary")

    # Document Uploads
    baptism_info_form = models.FileField(upload_to=upload_baptism_docs, blank=True, null=True)
    baptism_card = models.FileField(upload_to=upload_baptism_docs, blank=True, null=True)
    cbm_minutes_doc = models.FileField(upload_to=upload_baptism_docs, blank=True, null=True)
    cbm_minute_no = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. Min 42/2026")

    # Status & Member Links
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Processing')
    certificate_collected_at = models.DateTimeField(blank=True, null=True)
    
    member_profile = models.ForeignKey(
        'MemberRecord',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='baptism_records'
    )

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


# --- AUTO-SYNC BAPTISM RECORD TO MEMBER RECORD ---
@receiver(post_save, sender=BaptismRecord)
def sync_baptism_to_membership(sender, instance, created, **kwargs):
    """
    Automatically creates or updates a MemberRecord when a candidate is recorded or updated for baptism.
    """
    year_baptized = instance.baptism_date.year if instance.baptism_date else 2026

    # 1. If already linked to a member profile, update that profile
    if instance.member_profile:
        member = instance.member_profile
        member.full_name = instance.full_name
        member.gender = instance.gender
        if instance.email: 
            member.email = instance.email
        if instance.dob: 
            member.date_of_birth = instance.dob
        if instance.father_name: 
            member.father_name = instance.father_name
        if instance.father_phone: 
            member.father_phone = instance.father_phone
        if instance.mother_name: 
            member.mother_name = instance.mother_name
        if instance.mother_phone: 
            member.mother_phone = instance.mother_phone
        if instance.cbm_minute_no: 
            member.cbm_minute = instance.cbm_minute_no
        if instance.baptism_card: 
            member.baptism_card = instance.baptism_card
        member.save()

    # 2. Otherwise, find existing member by phone or full name, or create a new one
    else:
        member = None
        if instance.phone and instance.phone.strip():
            member = MemberRecord.objects.filter(phone_number=instance.phone).first()

        if not member and instance.full_name:
            member = MemberRecord.objects.filter(full_name__iexact=instance.full_name).first()

        if member:
            member.gender = instance.gender
            if instance.email: 
                member.email = instance.email
            if instance.dob: 
                member.date_of_birth = instance.dob
            if instance.father_name: 
                member.father_name = instance.father_name
            if instance.father_phone: 
                member.father_phone = instance.father_phone
            if instance.mother_name: 
                member.mother_name = instance.mother_name
            if instance.mother_phone: 
                member.mother_phone = instance.mother_phone
            member.joining_method = MethodOfEntry.BAPTISM
            member.year_joined = year_baptized
            if instance.cbm_minute_no: 
                member.cbm_minute = instance.cbm_minute_no
            if instance.baptism_card: 
                member.baptism_card = instance.baptism_card
            member.save()
        else:
            member = MemberRecord.objects.create(
                full_name=instance.full_name,
                gender=instance.gender,
                email=instance.email,
                phone_number=instance.phone,
                date_of_birth=instance.dob,
                father_name=instance.father_name,
                father_phone=instance.father_phone,
                mother_name=instance.mother_name,
                mother_phone=instance.mother_phone,
                joining_method=MethodOfEntry.BAPTISM,
                home_church='Newlife SDA Church',
                year_joined=year_baptized,
                cbm_minute=instance.cbm_minute_no,
                baptism_card=instance.baptism_card,
                is_active=True,
            )

        # Link member back to baptism record without re-triggering recursive signal loop
        BaptismRecord.objects.filter(pk=instance.pk).update(member_profile=member)

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


def upload_tor_path(instance, filename):
    return os.path.join('departments/tors/', filename)

def upload_report_path(instance, filename):
    return os.path.join('departments/reports/', filename)


class Department(models.Model):
    name = models.CharField(max_length=255, unique=True)
    leader = models.CharField(max_length=255)
    leader_phone = models.CharField(max_length=20, blank=True, null=True)
    # Stores dynamic list of objects: [{"name": "John Doe", "role": "Secretary", "phone": "+254712345678"}]
    council_members = models.JSONField(default=list, blank=True)
    tor_doc = models.FileField(upload_to=upload_tor_path, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class DepartmentRole(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='council_roles')
    member_name = models.CharField(max_length=255)
    designation = models.CharField(max_length=100) # e.g., "Chairman", "Secretary", "Sponsor"
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    
    def __str__(self):
        return f"{self.member_name} - {self.designation} ({self.department.name})"


class ChurchWorker(models.Model):
    WORKER_TYPES = [
        ('PASTOR', 'Pastor'),
        ('ELDER', 'Elder'),
        ('CLERK', 'Church Clerk'),
        ('DEACON', 'Deacon / Deaconess'),
        ('DEPT_LEADER', 'Department Leader'),
        ('STAFF', 'Church Staff'),
        ('OTHER', 'Other Worker'),
    ]

    full_name = models.CharField(max_length=255)
    designation = models.CharField(max_length=100, help_text="e.g. Senior Pastor, Head Elder, Choir Director")
    worker_type = models.CharField(max_length=50, choices=WORKER_TYPES, default='STAFF')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='workers')
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['full_name']
        verbose_name = _("Church Worker")
        verbose_name_plural = _("Church Workers")

    def __str__(self):
        return f"{self.full_name} - {self.designation}"


class DepartmentalReport(models.Model):
    REPORT_TYPES = (
        ('Monthly Report', 'Monthly Report'),
        ('Quarterly Report', 'Quarterly Report'),
        ('Event Report', 'Event Report'),
    )

    department = models.ForeignKey(
        Department, 
        on_delete=models.CASCADE, 
        related_name='reports'
    )
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    date = models.DateField()
    title = models.CharField(max_length=255)
    report_file = models.FileField(upload_to=upload_report_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-uploaded_at']

    def __str__(self):
        return f"{self.department.name} - {self.report_type} ({self.date})"


class Bulletin(models.Model):
    sabbath_date = models.DateField(
        help_text="The Sabbath date for this bulletin"
    )
    title = models.CharField(
        max_length=255, 
        blank=True, 
        help_text="Optional custom title (e.g. Sabbath Bulletin - July 25, 2026)"
    )
    file = models.FileField(
        upload_to='bulletins/%Y/%m/',
        help_text="Upload Bulletin PDF document"
    )
    file_size = models.CharField(max_length=50, blank=True, null=True)
    uploaded_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='uploaded_bulletins'
    )
    upload_date = models.DateTimeField(auto_now_add=True)
    
    # Broadcast Metadata
    whatsapp_sent = models.BooleanField(default=False)
    whatsapp_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-sabbath_date']
        verbose_name = "Sabbath Bulletin"
        verbose_name_plural = "Sabbath Bulletins"

    def __str__(self):
        return f"Bulletin for {self.sabbath_date} - {self.title or 'Weekly Bulletin'}"

    def save(self, *args, **kwargs):
        if self.file and not self.file_size:
            size_mb = self.file.size / (1024 * 1024)
            self.file_size = f"{size_mb:.1f} MB"
        
        if not self.title and self.sabbath_date:
            self.title = f"Sabbath Bulletin - {self.sabbath_date.strftime('%B %d, %Y')}"
            
        super().save(*args, **kwargs)


class Meeting(models.Model):
    CATEGORY_CHOICES = [
        ('Board Meetings', 'Board Meetings'),
        ('Business Meetings', 'Business Meetings'),
        ('Membership Reviews', 'Membership Reviews'),
        ('Delegate Related Meetings', 'Delegate Related Meetings'),
        ('Election Process Meetings', 'Election Process Meetings'),
        ('Committee Reporting Meetings', 'Committee Reporting Meetings'),
    ]

    STATUS_CHOICES = [
        ('Pending Minutes', 'Pending Minutes'),
        ('Minutes Confirmed', 'Minutes Confirmed'),
    ]

    meeting_ref = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES, default='Board Meetings')
    date = models.DateField()
    time = models.CharField(max_length=100)
    venue = models.CharField(max_length=255)
    chairperson = models.CharField(max_length=255)
    pastor = models.CharField(max_length=255)
    clerk = models.CharField(max_length=255)
    
    agenda_doc = models.FileField(upload_to='meetings/agendas/', blank=True, null=True)
    minutes_doc = models.FileField(upload_to='meetings/minutes/', blank=True, null=True)
    physical_sheet = models.FileField(upload_to='meetings/sheets/', blank=True, null=True)
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending Minutes')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.meeting_ref} - {self.category} ({self.date})"


class MeetingAttendance(models.Model):
    STATUS_CHOICES = [
        ('PR', 'Present'),
        ('AA', 'Absent with Apology'),
        ('WA', 'Absent without Apology'),
    ]

    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='attendances')
    member_name = models.CharField(max_length=255)
    department = models.ForeignKey('core.Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='meeting_attendances')
    status = models.CharField(max_length=2, choices=STATUS_CHOICES, default='PR')
    arrival_time = models.CharField(max_length=50, blank=True, null=True)
    departure_time = models.CharField(max_length=50, blank=True, null=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('meeting', 'member_name')

    def __str__(self):
        return f"{self.member_name} - {self.meeting.meeting_ref} [{self.status}]"


class AttendanceSheetUpload(models.Model):
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='uploaded_sheets')
    uploaded_file = models.FileField(upload_to='meetings/attendance_sheets/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)
    verbose_name = "Attendance Sheet Upload"
    verbose_name_plural = "Attendance Sheet Uploads"

    def __str__(self):
        return f"Sheet for {self.meeting.meeting_ref} ({self.uploaded_at.strftime('%Y-%m-%d')})"


class AbsenceApology(models.Model):
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='apologies')
    member_name = models.CharField(max_length=255)
    department = models.ForeignKey('core.Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='apologies')
    reason = models.TextField()
    supporting_doc = models.FileField(upload_to='meetings/apologies/', blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    verbose_name = "Absence Apology"
    verbose_name_plural = "Absence Apologies"

    def __str__(self):
        return f"Apology: {self.member_name} - {self.meeting.meeting_ref}"


class MethodOfEntry(models.TextChoices):
    BAPTISM = 'Baptism', 'Baptism'
    TRANSFER = 'Transfer', 'Transfer'
    PROFESSION_OF_FAITH = 'Profession of Faith', 'Profession of Faith'

class TransferStatus(models.TextChoices):
    REQUEST_MADE = 'Request Made', 'Request Made'
    BOARD_APPROVAL = 'Board Approval', 'Board Approval'
    FIRST_READING = '1st Reading', '1st Reading'
    SECOND_READING = '2nd Reading / Transfer Granted', '2nd Reading / Transfer Granted'

class MemberRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='member_profile'
    )

    full_name = models.CharField(max_length=255, db_index=True)
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female')])
    date_of_birth = models.DateField(null=True, blank=True)
    citizenship = models.CharField(max_length=100, default='Kenyan')
    phone_number = models.CharField(max_length=20, db_index=True, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    
    father_name = models.CharField(max_length=255, blank=True, null=True)
    father_phone = models.CharField(max_length=20, blank=True, null=True)
    father_email = models.EmailField(blank=True, null=True)
    
    mother_name = models.CharField(max_length=255, blank=True, null=True)
    mother_phone = models.CharField(max_length=20, blank=True, null=True)
    mother_email = models.EmailField(blank=True, null=True)

    joining_method = models.CharField(max_length=30, choices=MethodOfEntry.choices, default=MethodOfEntry.BAPTISM)
    home_church = models.CharField(max_length=255, default='Newlife SDA Church')
    year_joined = models.IntegerField(db_index=True)
    date_joined = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    former_faith = models.CharField(max_length=255, blank=True, null=True)
    previous_church_letter = models.FileField(upload_to='letters/previous_church/', blank=True, null=True)
    parents_consent_letter = models.FileField(upload_to='letters/parents/', blank=True, null=True)
    baptism_card = models.FileField(upload_to='cards/baptism/', blank=True, null=True)

    transfer_status = models.CharField(
        max_length=50, 
        choices=TransferStatus.choices, 
        default=TransferStatus.REQUEST_MADE,
        blank=True, null=True
    )
    transfer_type = models.CharField(
        max_length=20, 
        choices=[('Transfer In', 'Transfer In'), ('Transfer Out', 'Transfer Out')],
        default='Transfer In',
        blank=True, null=True
    )
    origin_church = models.CharField(max_length=255, blank=True, null=True)
    target_church = models.CharField(max_length=255, blank=True, null=True)
    board_meeting_date = models.DateField(null=True, blank=True)
    approval_minute = models.CharField(max_length=100, blank=True, null=True)
    first_reading_date = models.DateField(null=True, blank=True)
    second_reading_date = models.DateField(null=True, blank=True)
    cbm_minute = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['year_joined', 'joining_method']),
            models.Index(fields=['full_name', 'phone_number']),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.joining_method})"


class WeddingNotification(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('COMPLETED', 'Completed'),
    ]

    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='wedding_applications'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    notification_date = models.DateField(auto_now_add=True)

    applicant_name = models.CharField(max_length=255)
    applicant_membership = models.CharField(max_length=255, default='NEWLIFE SDA CHURCH, 5TH AVENUE')
    applicant_dob = models.DateField(null=True, blank=True)
    applicant_occupation = models.CharField(max_length=100, blank=True, null=True)
    applicant_phone = models.CharField(max_length=20)
    applicant_address = models.CharField(max_length=255, blank=True, null=True)
    applicant_signature_date = models.DateField(null=True, blank=True)

    spouse_name = models.CharField(max_length=255)
    spouse_church = models.CharField(max_length=255)
    spouse_conference = models.CharField(max_length=255, blank=True, null=True)
    spouse_membership_no = models.CharField(max_length=50, default='N/A', blank=True, null=True)
    spouse_dob = models.DateField(null=True, blank=True)
    spouse_occupation = models.CharField(max_length=100, blank=True, null=True)
    spouse_phone = models.CharField(max_length=20)
    spouse_address = models.CharField(max_length=255, blank=True, null=True)
    spouse_signature_date = models.DateField(null=True, blank=True)

    wedding_date = models.DateField()
    wedding_place = models.CharField(max_length=255, default='NEWLIFE SDA CHURCH')
    officiating_pastor = models.CharField(max_length=255)
    counseling_pastor = models.CharField(max_length=255, blank=True, null=True)
    officiating_elder = models.CharField(max_length=255)
    reception_venue = models.CharField(max_length=255, blank=True, null=True)

    notice_received_by = models.CharField(max_length=255, blank=True, null=True)
    notice_received_date = models.DateField(null=True, blank=True)

    groom_consent_file = models.FileField(upload_to='wedding_docs/groom_consents/', blank=True, null=True)
    bride_consent_file = models.FileField(upload_to='wedding_docs/bride_consents/', blank=True, null=True)
    recommendation_letter_file = models.FileField(upload_to='wedding_docs/recommendations/', blank=True, null=True)

    has_applicant_parent_consent = models.BooleanField(default=False)
    has_spouse_parent_consent = models.BooleanField(default=False)
    has_recommendation_letter = models.BooleanField(default=False)

    board_action_date = models.DateField(null=True, blank=True)
    board_recommendations = models.TextField(blank=True, null=True)
    board_chairman_signature = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-wedding_date']
        verbose_name = "Wedding Notification"
        verbose_name_plural = "Wedding Notifications"

    def __str__(self):
        return f"{self.applicant_name} & {self.spouse_name} - {self.wedding_date}"


class HolyCommunion(models.Model):
    QUARTER_CHOICES = [
        ('Q1', 'Quarter 1'),
        ('Q2', 'Quarter 2'),
        ('Q3', 'Quarter 3'),
        ('Q4', 'Quarter 4'),
    ]

    year = models.CharField(
        max_length=4, 
        default='2026', 
        db_index=True,
        help_text="Year of the Holy Communion service (e.g. 2026)"
    )
    quarter = models.CharField(
        max_length=2, 
        choices=QUARTER_CHOICES, 
        default='Q1',
        db_index=True,
        help_text="Quarter of the church year"
    )
    service_date = models.DateField(
        help_text="Date on which the Holy Communion service was conducted"
    )
    members_present = models.PositiveIntegerField(
        help_text="Total number of members who partook in Holy Communion"
    )
    remarks = models.TextField(
        blank=True, 
        null=True, 
        help_text="Optional clerk notes or pastoral service remarks"
    )
    file = models.FileField(
        upload_to='holy_communion_sheets/%Y/',
        help_text="Scanned attendance roster / signed communion sheet (PDF/DOC)"
    )
    recorded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='communion_records',
        help_text="Clerk who created this entry"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-service_date']
        verbose_name = 'Holy Communion Record'
        verbose_name_plural = 'Holy Communion Records'
        unique_together = ['year', 'quarter']

    def __str__(self):
        return f"Holy Communion - {self.year} {self.quarter} ({self.service_date})"


class Event(models.Model):
    class EventCategory(models.TextChoices):
        BOARD_MEETING = 'Board Meeting', 'Board Meeting'
        BUSINESS_MEETING = 'Church Business Meeting', 'Church Business Meeting'
        BAPTISM = 'Baptism', 'Baptism'
        CHILD_DEDICATION = 'Child Dedication', 'Child Dedication'
        WEDDING = 'Wedding', 'Wedding'
        HOLY_COMMUNION = 'Holy Communion', 'Holy Communion'
        CAMP_MEETING = 'Camp Meeting', 'Camp Meeting'
        EVANGELISM = 'Evangelism & Mission', 'Evangelism & Mission'
        DEPARTMENTAL = 'Departmental Event', 'Departmental Event'
        GENERAL = 'General Fellowship', 'General Fellowship'

    class TargetAudience(models.TextChoices):
        ALL = 'ALL', 'All Members & Public'
        BOARD = 'BOARD', 'Church Board Only'
        ELDERS = 'ELDERS', 'Elders Only'
        LEADERS = 'LEADERS', 'Departmental Leaders Only'
        CLERK_PASTOR = 'CLERK_PASTOR', 'Clerk & Pastors Only'

    class EventStatus(models.TextChoices):
        UPCOMING = 'Upcoming', 'Upcoming'
        ONGOING = 'Ongoing', 'Ongoing'
        COMPLETED = 'Completed', 'Completed'
        CANCELLED = 'Cancelled', 'Cancelled'

    title = models.CharField(max_length=255)
    event_type = models.CharField(max_length=50, choices=EventCategory.choices, default=EventCategory.GENERAL)
    target_audience = models.CharField(max_length=20, choices=TargetAudience.choices, default=TargetAudience.ALL)
    status = models.CharField(max_length=20, choices=EventStatus.choices, default=EventStatus.UPCOMING)

    is_multi_day = models.BooleanField(default=False)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    is_all_day = models.BooleanField(default=False)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

    venue = models.CharField(max_length=255, default='Main Sanctuary')
    organizer = models.CharField(max_length=255, default='Church Clerk Desk')
    description = models.TextField(blank=True, default='')

    groom_name = models.CharField(max_length=150, blank=True, default='')
    bride_name = models.CharField(max_length=150, blank=True, default='')

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='created_events'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date', 'start_time']
        verbose_name = 'Event'
        verbose_name_plural = 'Events'

    def clean(self):
        if self.is_multi_day and not self.end_date:
            raise ValidationError({'end_date': 'End date is required for multi-day events.'})
        
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError({'end_date': 'End date cannot be earlier than start date.'})

        if self.event_type == self.EventCategory.WEDDING:
            if not self.groom_name or not self.bride_name:
                raise ValidationError({
                    'groom_name': 'Groom name is required for weddings.',
                    'bride_name': 'Bride name is required for weddings.'
                })

    def save(self, *args, **kwargs):
        if not self.is_multi_day:
            self.end_date = self.start_date
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.start_date})"


class DepartmentalEvent(models.Model):
    class EventStatus(models.TextChoices):
        PROPOSED = 'PROPOSED', 'Proposed'
        APPROVED = 'APPROVED', 'Approved'
        ONGOING = 'ONGOING', 'Ongoing'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='departmental_events',
        help_text="Department organizing this event"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')

    # Auto-extracted from Department if left blank
    leader_in_charge = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Leader coordinating this event (auto-extracted from Department Leader if empty)"
    )
    leader_phone = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        help_text="Contact phone for event coordinator"
    )

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

    venue = models.CharField(max_length=255, default='Main Sanctuary')
    budget_estimate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    event_poster = models.FileField(upload_to='departments/events/posters/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=EventStatus.choices, default=EventStatus.PROPOSED)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_departmental_events'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date', 'start_time']
        verbose_name = 'Departmental Event'
        verbose_name_plural = 'Departmental Events'

    def save(self, *args, **kwargs):
        # Extract leader details from existing Department if not provided
        if self.department:
            if not self.leader_in_charge:
                self.leader_in_charge = self.department.leader
            if not self.leader_phone:
                self.leader_phone = self.department.leader_phone
        if not self.end_date:
            self.end_date = self.start_date
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.department.name} - {self.title} ({self.start_date})"

class DepartmentalMeeting(models.Model):
    class MeetingStatus(models.TextChoices):
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        PENDING_MINUTES = 'PENDING_MINUTES', 'Pending Minutes'

    class MeetingType(models.TextChoices):
        MONTHLY = 'Monthly', 'Monthly'
        QUARTERLY = 'Quarterly', 'Quarterly'
        EMERGENCY = 'Emergency', 'Emergency'
        PLANNING = 'Planning', 'Planning'

    department = models.ForeignKey(
        'Department',
        on_delete=models.CASCADE,
        related_name='departmental_meetings'
    )
    meeting_type = models.CharField(
        max_length=50, 
        choices=MeetingType.choices, 
        default=MeetingType.MONTHLY
    )
    title = models.CharField(max_length=255)
    meeting_ref = models.CharField(max_length=100, blank=True, null=True, unique=True)
    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    venue = models.CharField(max_length=255, default='Main Sanctuary')
    
    chairperson = models.CharField(max_length=255, blank=True, null=True)
    secretary = models.CharField(max_length=255, blank=True, null=True)
    
    agenda = models.TextField(blank=True, default='')
    agenda_doc = models.FileField(upload_to='departments/meetings/agendas/', blank=True, null=True)
    minutes_doc = models.FileField(upload_to='departments/meetings/minutes/', blank=True, null=True)
    
    status = models.CharField(
        max_length=30, 
        choices=MeetingStatus.choices, 
        default=MeetingStatus.SCHEDULED
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-start_time']


class DepartmentalMeetingAttendance(models.Model):
    STATUS_CHOICES = [
        ('PR', 'Present'),
        ('AA', 'Absent with Apology'),
        ('WA', 'Absent without Apology'),
    ]

    meeting = models.ForeignKey(
        DepartmentalMeeting, 
        on_delete=models.CASCADE, 
        related_name='attendances'
    )
    member_name = models.CharField(max_length=255)
    status = models.CharField(max_length=2, choices=STATUS_CHOICES, default='PR')
    arrival_time = models.CharField(max_length=50, blank=True, null=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('meeting', 'member_name')

    def __str__(self):
        return f"{self.member_name} - {self.meeting.title} [{self.status}]"