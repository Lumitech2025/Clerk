from rest_framework import serializers
import json
from .models import (
    Event, HolyCommunion, WeddingNotification, BaptismRecord, ChildDedication,
    Department, DepartmentRole, ChurchWorker, DepartmentalReport, Bulletin, 
    Meeting, MeetingAttendance, AttendanceSheetUpload, AbsenceApology, MemberRecord, DepartmentalEvent,
    DepartmentalMeeting, DepartmentalMeetingAttendance

)


class BaptismSerializer(serializers.ModelSerializer):
    baptism_info_form_url = serializers.SerializerMethodField()
    baptism_card_url = serializers.SerializerMethodField()
    cbm_minutes_doc_url = serializers.SerializerMethodField()

    class Meta:
        model = BaptismRecord
        fields = [
            'id',
            'full_name',
            'dob',
            'gender',
            'phone',
            'email',
            'father_name',
            'father_phone',
            'mother_name',
            'mother_phone',
            'officiating_pastor',
            'place_of_baptism',
            'baptism_date',
            'cbm_minute_no',
            'cbm_minutes_doc',
            'cbm_minutes_doc_url',
            'baptism_info_form',
            'baptism_info_form_url',
            'baptism_card',
            'baptism_card_url',
            'status',
            'certificate_collected_at',
            'member_profile',
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_baptism_info_form_url(self, obj):
        if obj.baptism_info_form:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.baptism_info_form.url) if request else obj.baptism_info_form.url
        return None

    def get_baptism_card_url(self, obj):
        if obj.baptism_card:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.baptism_card.url) if request else obj.baptism_card.url
        return None

    def get_cbm_minutes_doc_url(self, obj):
        if obj.cbm_minutes_doc:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.cbm_minutes_doc.url) if request else obj.cbm_minutes_doc.url
        return None

class ChildDedicationSerializer(serializers.ModelSerializer):
    childName = serializers.CharField(source='child_name', required=False)
    fatherName = serializers.CharField(source='father_name', required=False)
    motherName = serializers.CharField(source='mother_name', required=False)
    dedicationDate = serializers.DateField(source='dedication_date', required=False)
    officiatingPastor = serializers.CharField(source='officiating_pastor', required=False)

    class Meta:
        model = ChildDedication
        fields = [
            'id',
            'child_name',
            'childName',
            'father_name',
            'fatherName',
            'mother_name',
            'motherName',
            'dob',
            'phone',
            'email',
            'dedication_date',
            'dedicationDate',
            'officiating_pastor',
            'officiatingPastor',
            'status',
            'created_at',
            'updated_at'
        ]

    def to_representation(self, instance):
        return {
            'id': instance.id,
            'childName': instance.child_name,
            'fatherName': instance.father_name,
            'motherName': instance.mother_name,
            'dob': str(instance.dob),
            'phone': instance.phone,
            'email': instance.email,
            'dedicationDate': str(instance.dedication_date),
            'officiatingPastor': instance.officiating_pastor,
            'status': instance.status,
            'createdAt': instance.created_at,
            'updatedAt': instance.updated_at,
        }


class DepartmentRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentRole
        fields = ['id', 'member_name', 'designation', 'phone_number']


class DepartmentSerializer(serializers.ModelSerializer):
    tor_doc_url = serializers.SerializerMethodField()
    council_roles = DepartmentRoleSerializer(many=True, read_only=True)

    class Meta:
        model = Department
        fields = [
            'id', 
            'name', 
            'leader', 
            'leader_phone',
            'council_members', 
            'council_roles',
            'tor_doc', 
            'tor_doc_url', 
            'created_at', 
            'updated_at'
        ]
        extra_kwargs = {
            'tor_doc': {'write_only': True, 'required': False}
        }

    def get_tor_doc_url(self, obj):
        if obj.tor_doc:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.tor_doc.url)
            return obj.tor_doc.url
        return None

    def validate_council_members(self, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Invalid JSON format for council members.")
        return value


class ChurchWorkerSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = ChurchWorker
        fields = [
            'id', 
            'full_name', 
            'designation', 
            'worker_type', 
            'department', 
            'department_name', 
            'phone_number', 
            'email', 
            'is_active', 
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DepartmentalReportSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    report_file_url = serializers.SerializerMethodField()

    class Meta:
        model = DepartmentalReport
        fields = [
            'id', 
            'department', 
            'department_name', 
            'report_type', 
            'date', 
            'title', 
            'report_file', 
            'report_file_url', 
            'uploaded_at'
        ]
        extra_kwargs = {
            'report_file': {'write_only': True}
        }

    def get_report_file_url(self, obj):
        if obj.report_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.report_file.url)
            return obj.report_file.url
        return None


class BulletinSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.ReadOnlyField(source='uploaded_by.get_full_name')
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Bulletin
        fields = [
            'id', 
            'sabbath_date', 
            'title', 
            'file', 
            'file_url', 
            'file_size', 
            'uploaded_by', 
            'uploaded_by_name', 
            'upload_date', 
            'whatsapp_sent', 
            'whatsapp_sent_at'
        ]
        read_only_fields = ['file_size', 'uploaded_by', 'upload_date', 'whatsapp_sent', 'whatsapp_sent_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class MeetingAttendanceSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = MeetingAttendance
        fields = [
            'id', 'meeting', 'member_name', 'department', 
            'department_name', 'status', 'arrival_time', 'departure_time', 'recorded_at'
        ]


class AbsenceApologySerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = AbsenceApology
        fields = [
            'id', 'meeting', 'member_name', 'department', 
            'department_name', 'reason', 'supporting_doc', 'submitted_at'
        ]


class AttendanceSheetUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceSheetUpload
        fields = ['id', 'meeting', 'uploaded_file', 'uploaded_at', 'processed']


class MeetingSerializer(serializers.ModelSerializer):
    attendances = MeetingAttendanceSerializer(many=True, read_only=True)
    apologies = AbsenceApologySerializer(many=True, read_only=True)
    attendance_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Meeting
        fields = [
            'id', 'meeting_ref', 'category', 'date', 'time', 'venue', 
            'chairperson', 'pastor', 'clerk', 'agenda_doc', 'minutes_doc', 
            'physical_sheet', 'status', 'created_at', 'attendances', 
            'apologies', 'attendance_percentage'
        ]

    def get_attendance_percentage(self, obj):
        total_records = obj.attendances.count()
        if total_records == 0:
            return 0.0
        present_count = obj.attendances.filter(status='PR').count()
        return round((present_count / total_records) * 100, 2)


class MemberRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberRecord
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class DashboardAnalyticsSerializer(serializers.Serializer):
    total_active_members = serializers.IntegerField()
    baptisms_ytd = serializers.IntegerField()
    child_dedications_total = serializers.IntegerField()
    pending_transfers = serializers.IntegerField()
    upcoming_events_count = serializers.IntegerField(default=0)

    monthly_metrics = serializers.ListField(child=serializers.DictField())
    membership_transfers = serializers.DictField(required=False)
    baptism_trends = serializers.DictField(required=False)


class WeddingNotificationSerializer(serializers.ModelSerializer):
    groom_consent_file = serializers.FileField(required=False, allow_null=True)
    bride_consent_file = serializers.FileField(required=False, allow_null=True)
    recommendation_letter_file = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = WeddingNotification
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def create(self, validated_data):
        if validated_data.get('groom_consent_file'):
            validated_data['has_applicant_parent_consent'] = True
        if validated_data.get('bride_consent_file'):
            validated_data['has_spouse_parent_consent'] = True
        if validated_data.get('recommendation_letter_file'):
            validated_data['has_recommendation_letter'] = True

        return super().create(validated_data)


class HolyCommunionSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = HolyCommunion
        fields = [
            'id',
            'year',
            'quarter',
            'service_date',
            'members_present',
            'remarks',
            'file',
            'file_url',
            'file_name',
            'file_size',
            'recorded_by',
            'recorded_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'recorded_by']

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            full_name = obj.recorded_by.get_full_name()
            return full_name if full_name else obj.recorded_by.username
        return "Church Clerk"

    def get_file_name(self, obj):
        if obj.file and hasattr(obj.file, 'name'):
            return obj.file.name.split('/')[-1]
        return None

    def get_file_size(self, obj):
        if obj.file and hasattr(obj.file, 'size'):
            size = obj.file.size
            if size < 1024 * 1024:
                return f"{round(size / 1024, 1)} KB"
            return f"{round(size / (1024 * 1024), 1)} MB"
        return "0 KB"

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        elif obj.file:
            return obj.file.url
        return None


class EventSerializer(serializers.ModelSerializer):
    eventType = serializers.CharField(source='event_type', required=False)
    targetAudience = serializers.CharField(source='target_audience', required=False)
    isMultiDay = serializers.BooleanField(source='is_multi_day', required=False)
    isAllDay = serializers.BooleanField(source='is_all_day', required=False)
    startDate = serializers.DateField(source='start_date')
    endDate = serializers.DateField(source='end_date', required=False, allow_null=True)
    startTime = serializers.TimeField(source='start_time', required=False, allow_null=True)
    endTime = serializers.TimeField(source='end_time', required=False, allow_null=True)
    groomName = serializers.CharField(source='groom_name', required=False, allow_blank=True)
    brideName = serializers.CharField(source='bride_name', required=False, allow_blank=True)

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'eventType',
            'targetAudience',
            'status',
            'isMultiDay',
            'isAllDay',
            'startDate',
            'endDate',
            'startTime',
            'endTime',
            'venue',
            'organizer',
            'description',
            'groomName',
            'brideName',
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def validate(self, attrs):
        event_type = attrs.get('event_type', getattr(self.instance, 'event_type', None))
        groom_name = attrs.get('groom_name', getattr(self.instance, 'groom_name', ''))
        bride_name = attrs.get('bride_name', getattr(self.instance, 'bride_name', ''))

        if event_type == Event.EventCategory.WEDDING:
            if not groom_name or not bride_name:
                raise serializers.ValidationError({
                    "wedding": "Both Groom Name and Bride Name are required for wedding events."
                })

        return attrs

class DepartmentalEventSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    poster_url = serializers.SerializerMethodField()

    class Meta:
        model = DepartmentalEvent
        fields = [
            'id',
            'department',
            'department_name',
            'title',
            'description',
            'leader_in_charge',
            'leader_phone',
            'start_date',
            'end_date',
            'start_time',
            'end_time',
            'venue',
            'budget_estimate',
            'event_poster',
            'poster_url',
            'status',
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_poster_url(self, obj):
        if obj.event_poster:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.event_poster.url)
            return obj.event_poster.url
        return None

    def create(self, validated_data):
        # Extract existing leader details if missing during API payload submission
        department = validated_data.get('department')
        if department:
            if not validated_data.get('leader_in_charge'):
                validated_data['leader_in_charge'] = department.leader
            if not validated_data.get('leader_phone'):
                validated_data['leader_phone'] = department.leader_phone
        return super().create(validated_data)


class DepartmentalMeetingAttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentalMeetingAttendance
        fields = ['id', 'meeting', 'member_name', 'status', 'arrival_time', 'recorded_at']


class DepartmentalMeetingSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    attendances = DepartmentalMeetingAttendanceSerializer(many=True, read_only=True)
    agenda_doc_url = serializers.SerializerMethodField()
    minutes_doc_url = serializers.SerializerMethodField()
    attendance_summary = serializers.SerializerMethodField()

    class Meta:
        model = DepartmentalMeeting
        fields = [
            'id',
            'department',
            'department_name',
            'title',
            'meeting_ref',
            'date',
            'start_time',
            'end_time',
            'venue',
            'chairperson',
            'secretary',
            'agenda',
            'agenda_doc',
            'agenda_doc_url',
            'minutes_doc',
            'minutes_doc_url',
            'status',
            'attendances',
            'attendance_summary',
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_agenda_doc_url(self, obj):
        if obj.agenda_doc:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.agenda_doc.url)
            return obj.agenda_doc.url
        return None

    def get_minutes_doc_url(self, obj):
        if obj.minutes_doc:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.minutes_doc.url)
            return obj.minutes_doc.url
        return None

    def get_attendance_summary(self, obj):
        total = obj.attendances.count()
        if total == 0:
            return {"total": 0, "present": 0, "absent_apology": 0, "absent_unexcused": 0, "percentage": 0.0}
        present = obj.attendances.filter(status='PR').count()
        apology = obj.attendances.filter(status='AA').count()
        unexcused = obj.attendances.filter(status='WA').count()
        return {
            "total": total,
            "present": present,
            "absent_apology": apology,
            "absent_unexcused": unexcused,
            "percentage": round((present / total) * 100, 2)
        }