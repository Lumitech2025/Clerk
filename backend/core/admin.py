from django.contrib import admin
from .models import (
    MemberRecord,
    BaptismRecord,
    ChildDedication,
    Department,
    DepartmentalReport,
    Bulletin,
    Meeting,
    MeetingAttendance,
    AttendanceSheetUpload,
    AbsenceApology,
    WeddingNotification
)


# ==========================================
# INLINES FOR MEETING MANAGEMENT
# ==========================================

class MeetingAttendanceInline(admin.TabularInline):
    model = MeetingAttendance
    extra = 1
    fields = ('member_name', 'department', 'status', 'arrival_time', 'recorded_at')
    readonly_fields = ('recorded_at',)
    show_change_link = True


class AbsenceApologyInline(admin.StackedInline):
    model = AbsenceApology
    extra = 0
    fields = ('member_name', 'department', 'reason', 'submitted_at')
    readonly_fields = ('submitted_at',)
    show_change_link = True


class AttendanceSheetUploadInline(admin.TabularInline):
    model = AttendanceSheetUpload
    extra = 1
    fields = ('uploaded_file', 'processed', 'uploaded_at')
    readonly_fields = ('uploaded_at',)


# ==========================================
# ADMIN MODEL REGISTRATIONS
# ==========================================

@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = (
        'meeting_ref',
        'category',
        'date',
        'venue',
        'chairperson',
        'status',
        'created_at',
    )
    list_filter = ('category', 'status', 'date')
    search_fields = ('meeting_ref', 'venue', 'chairperson', 'pastor', 'clerk')
    inlines = [MeetingAttendanceInline, AbsenceApologyInline, AttendanceSheetUploadInline]


@admin.register(BaptismRecord)
class BaptismAdmin(admin.ModelAdmin):
    list_display = (
        'full_name',
        'gender',
        'phone',
        'officiating_pastor',
        'baptism_date',
        'status',
    )
    list_filter = ('status', 'gender', 'baptism_date')
    search_fields = ('full_name', 'phone', 'email', 'officiating_pastor')
    list_editable = ('status',)
    date_hierarchy = 'baptism_date'


@admin.register(ChildDedication)
class ChildDedicationAdmin(admin.ModelAdmin):
    list_display = (
        'child_name',
        'father_name',
        'mother_name',
        'dob',
        'dedication_date',
        'officiating_pastor',
        'phone',
        'status',
    )
    list_filter = ('status', 'dedication_date', 'officiating_pastor')
    search_fields = ('child_name', 'father_name', 'mother_name', 'phone', 'email')
    ordering = ('-dedication_date',)
    list_editable = ('status',)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'leader', 'has_tor_doc', 'created_at')
    search_fields = ('name', 'leader')

    def has_tor_doc(self, obj):
        return bool(obj.tor_doc)

    has_tor_doc.boolean = True
    has_tor_doc.short_description = 'TOR Uploaded'


@admin.register(DepartmentalReport)
class DepartmentalReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'department', 'report_type', 'date', 'uploaded_at')
    list_filter = ('report_type', 'department', 'date')
    search_fields = ('title', 'department__name')


@admin.register(Bulletin)
class BulletinAdmin(admin.ModelAdmin):
    list_display = (
        'sabbath_date',
        'title',
        'file_size',
        'uploaded_by',
        'upload_date',
        'whatsapp_sent',
    )
    list_filter = ('sabbath_date', 'whatsapp_sent', 'upload_date')
    search_fields = ('title', 'sabbath_date')
    readonly_fields = ('file_size', 'uploaded_by', 'upload_date', 'whatsapp_sent_at')

    def save_model(self, request, obj, form, change):
        if not change or not obj.uploaded_by:
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(MemberRecord)
class MemberRecordAdmin(admin.ModelAdmin):
    list_display = (
        'full_name',
        'gender',
        'phone_number',
        'joining_method',
        'year_joined',
        'transfer_status',
        'is_active',
    )
    list_filter = (
        'joining_method',
        'year_joined',
        'gender',
        'transfer_status',
        'is_active',
    )
    search_fields = (
        'full_name',
        'phone_number',
        'email',
        'approval_minute',
        'cbm_minute',
    )
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')

    fieldsets = (
        (
            'Basic Information',
            {
                'fields': (
                    'id',
                    'user',
                    'full_name',
                    'gender',
                    'date_of_birth',
                    'citizenship',
                    'phone_number',
                    'email',
                    'is_active',
                )
            },
        ),
        (
            'Parents Information',
            {
                'fields': (
                    'father_name',
                    'father_phone',
                    'father_email',
                    'mother_name',
                    'mother_phone',
                    'mother_email',
                )
            },
        ),
        (
            'Admission & Registry Info',
            {
                'fields': ('joining_method', 'home_church', 'year_joined'),
            },
        ),
        (
            'Profession of Faith & Attachments',
            {
                'fields': (
                    'former_faith',
                    'previous_church_letter',
                    'parents_consent_letter',
                    'baptism_card',
                ),
            },
        ),
        (
            'Transfer Progress Tracking',
            {
                'fields': (
                    'transfer_status',
                    'transfer_type',
                    'origin_church',
                    'target_church',
                    'board_meeting_date',
                    'approval_minute',
                    'first_reading_date',
                    'second_reading_date',
                    'cbm_minute',
                )
            },
        ),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


# Optional standalone registrations if you still want quick access to individual sub-tables:
@admin.register(MeetingAttendance)
class MeetingAttendanceAdmin(admin.ModelAdmin):
    list_display = (
        'member_name',
        'meeting',
        'department',
        'status',
        'arrival_time',
        'recorded_at',
    )
    list_filter = ('status', 'department', 'meeting')
    search_fields = ('member_name', 'meeting__meeting_ref')


@admin.register(AbsenceApology)
class AbsenceApologyAdmin(admin.ModelAdmin):
    list_display = ('member_name', 'meeting', 'department', 'submitted_at')
    search_fields = ('member_name', 'reason', 'meeting__meeting_ref')


@admin.register(AttendanceSheetUpload)
class AttendanceSheetUploadAdmin(admin.ModelAdmin):
    list_display = ('meeting', 'uploaded_file', 'processed', 'uploaded_at')
    list_filter = ('processed', 'uploaded_at')


@admin.register(WeddingNotification)
class WeddingNotificationAdmin(admin.ModelAdmin):
    list_display = (
        'applicant_name', 
        'spouse_name', 
        'wedding_date', 
        'status', 
        'officiating_pastor', 
        'officiating_elder',
        'has_applicant_parent_consent',
        'has_spouse_parent_consent'
    )
    list_filter = ('status', 'wedding_date', 'has_applicant_parent_consent', 'has_spouse_parent_consent')
    search_fields = (
        'applicant_name', 
        'spouse_name', 
        'applicant_phone', 
        'spouse_phone', 
        'officiating_pastor', 
        'officiating_elder'
    )
    date_hierarchy = 'wedding_date'
    
    fieldsets = (
        ('Status & Registration', {
            'fields': ('status', 'submitted_by', 'notice_received_by', 'notice_received_date')
        }),
        ('Groom / Applicant Particulars', {
            'fields': (
                'applicant_name', 
                'applicant_membership', 
                'applicant_dob', 
                'applicant_occupation', 
                'applicant_phone', 
                'applicant_address',
                'applicant_signature_date'
            )
        }),
        ('Bride / Spouse Particulars', {
            'fields': (
                'spouse_name', 
                'spouse_church', 
                'spouse_conference', 
                'spouse_membership_no', 
                'spouse_dob', 
                'spouse_occupation', 
                'spouse_phone', 
                'spouse_address',
                'spouse_signature_date'
            )
        }),
        ('Wedding & Officiating Details', {
            'fields': (
                'wedding_date', 
                'wedding_place', 
                'reception_venue', 
                'officiating_pastor', 
                'counseling_pastor', 
                'officiating_elder'
            )
        }),
        ('Supporting Documents', {
            'fields': (
                'groom_consent_file', 
                'has_applicant_parent_consent',
                'bride_consent_file', 
                'has_spouse_parent_consent',
                'recommendation_letter_file', 
                'has_recommendation_letter'
            )
        }),
        ('Official Board Action', {
            'fields': (
                'board_action_date', 
                'board_recommendations', 
                'board_chairman_signature'
            )
        }),
    )

try:
    admin.site.unregister(MeetingAttendance)
    admin.site.unregister(AbsenceApology)
    admin.site.unregister(AttendanceSheetUpload)
except admin.sites.NotRegistered:
    pass