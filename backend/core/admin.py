from django.contrib import admin
from .models import BaptismRecord, ChildDedication, Department, DepartmentalReport, Bulletin, Meeting, MeetingAttendance, AttendanceSheetUpload, AbsenceApology

@admin.register(BaptismRecord)
class BaptismAdmin(admin.ModelAdmin):
    list_display = (
        'full_name', 
        'gender', 
        'phone', 
        'officiating_pastor', 
        'baptism_date', 
        'status'
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
        'status'
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
    list_display = ('sabbath_date', 'title', 'file_size', 'uploaded_by', 'upload_date', 'whatsapp_sent')
    list_filter = ('sabbath_date', 'whatsapp_sent', 'upload_date')
    search_fields = ('title', 'sabbath_date')
    readonly_fields = ('file_size', 'uploaded_by', 'upload_date', 'whatsapp_sent_at')

    def save_model(self, request, obj, form, change):
        if not change or not obj.uploaded_by:
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)



@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('meeting_ref', 'category', 'date', 'venue', 'chairperson', 'status', 'created_at')
    list_filter = ('category', 'status', 'date')
    search_fields = ('meeting_ref', 'venue', 'chairperson', 'pastor', 'clerk')

@admin.register(MeetingAttendance)
class MeetingAttendanceAdmin(admin.ModelAdmin):
    list_display = ('member_name', 'meeting', 'department', 'status', 'arrival_time', 'recorded_at')
    list_filter = ('status', 'department', 'meeting')
    search_fields = ('member_name', 'meeting__meeting_ref')

@admin.register(AttendanceSheetUpload)
class AttendanceSheetUploadAdmin(admin.ModelAdmin):
    list_display = ('meeting', 'uploaded_file', 'processed', 'uploaded_at')
    list_filter = ('processed', 'uploaded_at')

@admin.register(AbsenceApology)
class AbsenceApologyAdmin(admin.ModelAdmin):
    list_display = ('member_name', 'meeting', 'department', 'submitted_at')
    search_fields = ('member_name', 'reason', 'meeting__meeting_ref')