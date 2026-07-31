from django.contrib import admin

from .models import (
    MemberRecord,
    BaptismRecord,
    ChildDedication,
    Department,
    DepartmentRole,
    ChurchWorker,
    DepartmentalReport,
    Bulletin,
    Meeting,
    MeetingAttendance,
    AttendanceSheetUpload,
    AbsenceApology,
    WeddingNotification,
    HolyCommunion,
    Event,
    DepartmentalEvent,
    DepartmentalMeeting,
    DepartmentalMeetingAttendance
)

# ==========================================
# INLINES FOR MEETING & DEPARTMENT MANAGEMENT
# ==========================================

class DepartmentRoleInline(admin.TabularInline):
    model = DepartmentRole
    extra = 1
    fields = ('member_name', 'designation', 'phone_number')


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

@admin.register(ChurchWorker)
class ChurchWorkerAdmin(admin.ModelAdmin):
    list_display = (
        'full_name',
        'designation',
        'worker_type',
        'department',
        'phone_number',
        'email',
        'is_active',
    )
    list_filter = ('worker_type', 'is_active', 'department')
    search_fields = ('full_name', 'designation', 'phone_number', 'email')
    list_editable = ('is_active',)


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
        'place_of_baptism',
        'cbm_minute_no',
        'baptism_date',
        'status',
    )
    list_filter = ('status', 'gender', 'baptism_date')
    search_fields = ('full_name', 'phone', 'email', 'officiating_pastor', 'cbm_minute_no')
    list_editable = ('status',)
    date_hierarchy = 'baptism_date'

    fieldsets = (
        ('Candidate Details', {
            'fields': ('full_name', 'dob', 'gender', 'phone', 'email')
        }),
        ('Parent Details', {
            'fields': ('father_name', 'father_phone', 'mother_name', 'mother_phone')
        }),
        ('Ceremony & Church Minutes', {
            'fields': ('officiating_pastor', 'place_of_baptism', 'baptism_date', 'cbm_minute_no')
        }),
        ('Documents & Attachments', {
            'fields': ('baptism_info_form', 'baptism_card', 'cbm_minutes_doc')
        }),
        ('Status & Metadata', {
            'fields': ('status', 'certificate_collected_at', 'member_profile', 'created_by')
        }),
    )


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
    list_display = ('name', 'leader', 'leader_phone', 'has_tor_doc', 'created_at')
    search_fields = ('name', 'leader', 'leader_phone')
    inlines = [DepartmentRoleInline]

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


@admin.register(HolyCommunion)
class HolyCommunionAdmin(admin.ModelAdmin):
    list_display = (
        'year', 
        'quarter', 
        'service_date', 
        'members_present', 
        'recorded_by', 
        'created_at'
    )
    list_filter = ('year', 'quarter', 'service_date')
    search_fields = ('year', 'quarter', 'remarks', 'recorded_by__username', 'recorded_by__first_name')
    date_hierarchy = 'service_date'
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Quarter & Service Details', {
            'fields': ('year', 'quarter', 'service_date', 'members_present')
        }),
        ('Attendance File & Remarks', {
            'fields': ('file', 'remarks')
        }),
        ('System Metadata', {
            'fields': ('recorded_by', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change and not obj.recorded_by:
            obj.recorded_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        'title', 
        'event_type', 
        'start_date', 
        'end_date', 
        'is_multi_day', 
        'target_audience', 
        'status', 
        'created_by'
    )
    list_filter = ('event_type', 'target_audience', 'status', 'is_multi_day', 'is_all_day', 'start_date')
    search_fields = ('title', 'venue', 'organizer', 'groom_name', 'bride_name', 'description')
    date_hierarchy = 'start_date'
    
    fieldsets = (
        ('General Information', {
            'fields': ('title', 'event_type', 'target_audience', 'status', 'description')
        }),
        ('Schedule', {
            'fields': (('is_multi_day', 'is_all_day'), ('start_date', 'end_date'), ('start_time', 'end_time'))
        }),
        ('Logistics', {
            'fields': ('venue', 'organizer')
        }),
        ('Wedding Details (Conditional)', {
            'classes': ('collapse',),
            'fields': ('groom_name', 'bride_name'),
        }),
        ('System Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )

    readonly_fields = ('created_at', 'updated_at')




@admin.register(DepartmentalEvent)
class DepartmentalEventAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'department',
        'leader_in_charge',
        'leader_phone',
        'start_date',
        'end_date',
        'venue',
        'status',
        'created_by',
    )
    list_filter = ('status', 'department', 'start_date')
    search_fields = ('title', 'venue', 'leader_in_charge', 'department__name', 'description')
    date_hierarchy = 'start_date'
    list_editable = ('status',)
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('General Details', {
            'fields': ('department', 'title', 'description', 'status')
        }),
        ('Leadership Details (Extracted from Department)', {
            'fields': ('leader_in_charge', 'leader_phone')
        }),
        ('Schedule & Venue', {
            'fields': (('start_date', 'end_date'), ('start_time', 'end_time'), 'venue')
        }),
        ('Budget & Publicity', {
            'fields': ('budget_estimate', 'event_poster')
        }),
        ('System Information', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change or not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

class DepartmentalMeetingAttendanceInline(admin.TabularInline):
    model = DepartmentalMeetingAttendance
    extra = 1
    fields = ('member_name', 'status', 'arrival_time', 'recorded_at')
    readonly_fields = ('recorded_at',)


@admin.register(DepartmentalMeeting)
class DepartmentalMeetingAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'department',
        'date',
        'start_time',
        'venue',
        'chairperson',
        'status',
        'created_by',
    )
    list_filter = ('status', 'department', 'date')
    search_fields = ('title', 'meeting_ref', 'venue', 'chairperson', 'department__name')
    date_hierarchy = 'date'
    inlines = [DepartmentalMeetingAttendanceInline]
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('General Information', {
            'fields': ('department', 'title', 'meeting_ref', 'status')
        }),
        ('Schedule & Venue', {
            'fields': (('date', 'start_time', 'end_time'), 'venue')
        }),
        ('Leadership & Documents', {
            'fields': (('chairperson', 'secretary'), 'agenda', 'agenda_doc', 'minutes_doc')
        }),
        ('System Information', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change or not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

try:
    admin.site.unregister(MeetingAttendance)
    admin.site.unregister(AbsenceApology)
    admin.site.unregister(AttendanceSheetUpload)
except admin.sites.NotRegistered:
    pass