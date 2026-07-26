# core/views.py

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, filters
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Count, Q

from authentication.permissions import IsChurchClerk, IsPastoralTeam

from .models import BaptismRecord, ChildDedication, Department, DepartmentalReport, Bulletin, Meeting, MeetingAttendance, AttendanceSheetUpload, AbsenceApology
from .serializers import BaptismSerializer, ChildDedicationSerializer, DepartmentSerializer, DepartmentalReportSerializer,  BulletinSerializer, MeetingSerializer, MeetingAttendanceSerializer, AttendanceSheetUploadSerializer, AbsenceApologySerializer
from .services import (
    send_welcome_baptism_notifications, 
    send_certificate_reminder_notifications,
    send_welcome_dedication_notifications,
    send_dedication_certificate_reminder_notifications
    
)

class BaptismViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for managing official church baptism records.
    Only authorized administrative personnel (Clerk, Pastors, Elders) 
    can manage and trigger lifecycle notifications.
    """
    queryset = BaptismRecord.objects.all().order_by('-created_at')
    serializer_class = BaptismSerializer
    
    # 1. Secure viewset with authentication and RBAC permissions
    permission_classes = [IsAuthenticated, IsPastoralTeam]

    def perform_create(self, serializer):
        """
        Saves the record ONCE with the authenticated creator, 
        then dispatches the welcome notification via background service.
        """
        # Save instance and assign creator in a single DB write
        instance = serializer.save(created_by=self.request.user)
        
        # Trigger welcome notification service
        send_welcome_baptism_notifications(instance)

    @action(detail=True, methods=['post'], url_path='send-reminder', permission_classes=[IsAuthenticated, IsChurchClerk])
    def send_reminder(self, request, pk=None):
        """
        Custom endpoint triggered when Clerk clicks "Send Reminder" button on frontend.
        Endpoint: POST /api/baptisms/{id}/send-reminder/
        """
        baptism = self.get_object()
        
        # Trigger notification service
        send_certificate_reminder_notifications(baptism)

        return Response(
            {"message": f"Reminder successfully sent to {baptism.full_name} via SMS and Email."},
            status=status.HTTP_200_OK
        )


class ChildDedicationViewSet(viewsets.ModelViewSet):
    queryset = ChildDedication.objects.all()
    serializer_class = ChildDedicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ChildDedication.objects.all()
        search = self.request.query_params.get('search', None)
        status_param = self.request.query_params.get('status', None)

        if search:
            queryset = queryset.filter(
                child_name__icontains=search
            ) | queryset.filter(
                father_name__icontains=search
            ) | queryset.filter(
                mother_name__icontains=search
            ) | queryset.filter(
                officiating_pastor__icontains=search
            ) | queryset.filter(
                phone__icontains=search
            )

        if status_param and status_param != 'All':
            queryset = queryset.filter(status=status_param)

        return queryset

    def perform_create(self, serializer):
        """Automatically trigger welcoming notification when a record is created."""
        dedication = serializer.save()
        send_welcome_dedication_notifications(dedication)

    @action(detail=True, methods=['post'], url_path='send-reminder')
    def send_reminder(self, request, pk=None):
        """Action endpoint to send certificate pickup notifications."""
        dedication = self.get_object()
        
        # Trigger SMS & Email messaging service
        send_dedication_certificate_reminder_notifications(dedication)

        return Response({
            "message": f"Reminder notifications dispatched to parents of {dedication.child_name}."
        }, status=status.HTTP_200_OK)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'leader']
    ordering_fields = ['name', 'created_at']


class DepartmentalReportViewSet(viewsets.ModelViewSet):
    queryset = DepartmentalReport.objects.all()
    serializer_class = DepartmentalReportSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'report_type']
    search_fields = ['title', 'department__name']
    ordering_fields = ['date', 'uploaded_at']



class BulletinViewSet(viewsets.ModelViewSet):
    queryset = Bulletin.objects.all()
    serializer_class = BulletinSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    @action(detail=True, methods=['get'])
    def whatsapp_payload(self, request, pk=None):
        """
        Returns pre-formatted text payload and document URL for single or multi-group sharing.
        """
        bulletin = self.get_object()
        formatted_date = bulletin.sabbath_date.strftime('%A, %B %d, %Y')
        file_url = request.build_absolute_uri(bulletin.file.url) if bulletin.file else ""

        message = (
            f"*NEWLIFE SDA CHURCH - WEEKLY BULLETIN*\n"
            f"📅 *Sabbath Date:* {formatted_date}\n"
            f"📰 *Title:* {bulletin.title}\n\n"
            f"Greetings saints! Please find the official church bulletin for this Sabbath attached below or download it directly using the link:\n"
            f"🔗 {file_url}\n\n"
            f"Blessed Sabbath! 🙏✨"
        )

        return Response({
            'bulletin_id': bulletin.id,
            'message': message,
            'file_url': file_url
        })

    @action(detail=True, methods=['post'])
    def mark_whatsapp_sent(self, request, pk=None):
        """
        Call this endpoint after dispatching via WhatsApp API/Web.
        """
        bulletin = self.get_object()
        bulletin.whatsapp_sent = True
        bulletin.whatsapp_sent_at = timezone.now()
        bulletin.save()
        return Response({'status': 'marked as sent', 'whatsapp_sent_at': bulletin.whatsapp_sent_at})




class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all().order_by('-date')
    serializer_class = MeetingSerializer

    @action(detail=True, methods=['get'])
    def attendance_summary(self, request, pk=None):
        meeting = self.get_object()
        total = meeting.attendances.count()
        present = meeting.attendances.filter(status='PR').count()
        absent_apology = meeting.attendances.filter(status='AA').count()
        absent_no_apology = meeting.attendances.filter(status='WA').count()
        
        pct = round((present / total * 100), 2) if total > 0 else 0.0

        return Response({
            'meeting_ref': meeting.meeting_ref,
            'total_logged': total,
            'present': present,
            'absent_apology': absent_apology,
            'absent_no_apology': absent_no_apology,
            'attendance_percentage': f"{pct}%"
        })

    @action(detail=False, methods=['get'])
    def board_attendance_matrix(self, request):
        year = request.query_params.get('year', 2026)
        members = MeetingAttendance.objects.filter(meeting__date__year=year)\
            .values('member_name', 'department__name')\
            .annotate(
                total_meetings=Count('id'),
                present_count=Count('id', filter=Q(status='PR'))
            )

        matrix = []
        for idx, m in enumerate(members, 1):
            total = m['total_meetings']
            present = m['present_count']
            pct = round((present / total * 100), 2) if total > 0 else 0.0
            matrix.append({
                'sNo': idx,
                'name': m['member_name'],
                'dept': m['department__name'] or 'General Member',
                'total_meetings': total,
                'present_count': present,
                'percentage': f"{pct:.2f}%"
            })

        return Response(matrix)


class MeetingAttendanceViewSet(viewsets.ModelViewSet):
    queryset = MeetingAttendance.objects.all().order_by('-recorded_at')
    serializer_class = MeetingAttendanceSerializer


class AttendanceSheetUploadViewSet(viewsets.ModelViewSet):
    queryset = AttendanceSheetUpload.objects.all().order_by('-uploaded_at')
    serializer_class = AttendanceSheetUploadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sheet_instance = serializer.save()

        # Mark processed and auto-calculate summary statistics for response
        sheet_instance.processed = True
        sheet_instance.save()

        meeting = sheet_instance.meeting
        total_records = meeting.attendances.count()
        present_records = meeting.attendances.filter(status='PR').count()
        pct = round((present_records / total_records * 100), 2) if total_records > 0 else 0.0

        headers = self.get_success_headers(serializer.data)
        return Response({
            'sheet': serializer.data,
            'message': 'Attendance sheet uploaded and processed.',
            'calculated_attendance_percentage': f"{pct}%",
            'total_attendees': total_records,
            'present_count': present_records
        }, status=status.HTTP_201_CREATED, headers=headers)


class AbsenceApologyViewSet(viewsets.ModelViewSet):
    queryset = AbsenceApology.objects.all().order_by('-submitted_at')
    serializer_class = AbsenceApologySerializer

    def perform_create(self, serializer):
        apology = serializer.save()
        # Automatically register or update the member's status as 'AA' (Absent with Apology)
        MeetingAttendance.objects.update_or_create(
            meeting=apology.meeting,
            member_name=apology.member_name,
            defaults={
                'department': apology.department,
                'status': 'AA'
            }
        )

