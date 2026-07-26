from rest_framework import serializers
import json
from .models import BaptismRecord, ChildDedication,Department, DepartmentalReport, Bulletin,Meeting, MeetingAttendance, AttendanceSheetUpload, AbsenceApology, Department

class BaptismSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaptismRecord
        fields = [
            'id',
            'full_name',
            'dob',
            'gender',
            'phone',
            'email',
            'officiating_pastor',
            'place_of_baptism',
            'baptism_date',
            'status',
            'created_at',
            'updated_at'
        ]



class ChildDedicationSerializer(serializers.ModelSerializer):
    # Aliases to safely accept camelCase input from React JSX
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
        """Format output payload to match frontend JSX expects."""
        ret = super().to_representation(instance)
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




class DepartmentSerializer(serializers.ModelSerializer):
    tor_doc_url = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id', 
            'name', 
            'leader', 
            'council_members', 
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
        # Handle stringified JSON input if sent via multipart/form-data
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Invalid JSON format for council members.")
        return value


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