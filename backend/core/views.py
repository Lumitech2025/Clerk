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
from rest_framework.pagination import PageNumberPagination
from django.db.models.functions import TruncMonth




from .models import MemberRecord, BaptismRecord, ChildDedication
from .serializers import DashboardAnalyticsSerializer


from authentication.permissions import IsChurchClerk, IsPastoralTeam

from .models import WeddingNotification, BaptismRecord, ChildDedication, Department, DepartmentalReport, Bulletin, Meeting, MeetingAttendance, AttendanceSheetUpload, AbsenceApology, MemberRecord
from .serializers import WeddingNotificationSerializer, BaptismSerializer, ChildDedicationSerializer, DepartmentSerializer, DepartmentalReportSerializer,  BulletinSerializer, MeetingSerializer, MeetingAttendanceSerializer, AttendanceSheetUploadSerializer, AbsenceApologySerializer, MemberRecordSerializer
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


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class IsClerkOrPastorOrElder(permissions.BasePermission):
    """Custom Permission to enforce Role-Based Access Control."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # 1. Superusers always have full access
        if request.user.is_superuser:
            return True
            
        # 2. Get role safely (from Custom User or Profile model)
        user_role = getattr(request.user, 'role', None)
        
        # If your role field is on a related profile model instead, uncomment below:
        # if user_role is None and hasattr(request.user, 'profile'):
        #     user_role = getattr(request.user.profile, 'role', None)

        if user_role in ['clerk', 'pastor', 'elder']:
            return True
            
        if request.method in permissions.SAFE_METHODS and user_role in ['communication', 'department_leader', 'member']:
            return True

        return False

class MemberRecordViewSet(viewsets.ModelViewSet):
    queryset = MemberRecord.objects.all()
    serializer_class = MemberRecordSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsClerkOrPastorOrElder]
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['year_joined', 'joining_method', 'gender', 'transfer_status', 'is_active']
    search_fields = ['full_name', 'phone_number', 'email', 'origin_church']
    ordering_fields = ['full_name', 'year_joined', 'created_at']

class DashboardAnalyticsViewSet(viewsets.ViewSet):
    """
    ViewSet to deliver core dashboard summary metrics & trend analytics.
    Endpoint: GET /api/analytics/
    """
    permission_classes = [permissions.IsAuthenticated, IsClerkOrPastorOrElder]

    def list(self, request):
        current_year = timezone.now().year

        # 1. KPI Cards
        total_active_members = MemberRecord.objects.filter(is_active=True).count()
        baptisms_ytd = BaptismRecord.objects.filter(baptism_date__year=current_year).count()
        child_dedications_total = ChildDedication.objects.count()
        
        # Pending transfers (transfers still undergoing board or reading process)
        pending_transfers = MemberRecord.objects.filter(
            ~Q(transfer_status='2nd Reading / Transfer Granted'),
            transfer_status__isnull=False
        ).count()

        # 2. Baptism Trends (Monthly count for the current year)
        baptism_months = (
            BaptismRecord.objects.filter(baptism_date__year=current_year)
            .annotate(month=TruncMonth('baptism_date'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        
        # Format monthly data into array or key-value map for frontend charts
        monthly_baptism_data = [0] * 12
        for entry in baptism_months:
            if entry['month']:
                month_idx = entry['month'].month - 1
                monthly_baptism_data[month_idx] = entry['count']

        # 3. Membership Transfers (Incoming vs Outgoing breakdown)
        incoming_transfers = MemberRecord.objects.filter(transfer_type='Transfer In').count()
        outgoing_transfers = MemberRecord.objects.filter(transfer_type='Transfer Out').count()

        analytics_data = {
            'total_active_members': total_active_members,
            'baptisms_ytd': baptisms_ytd,
            'child_dedications_total': child_dedications_total,
            'pending_transfers': pending_transfers,
            'membership_transfers': {
                'incoming': incoming_transfers,
                'outgoing': outgoing_transfers,
            },
            'baptism_trends': {
                'year': current_year,
                'monthly_counts': monthly_baptism_data
            }
        }

        serializer = DashboardAnalyticsSerializer(analytics_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class IsChurchLeaderOrClerk(permissions.BasePermission):
    """
    Custom permission for Church Clerks, Pastors, and Elders.
    Assumes role attributes or group memberships on User model.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusers always have full access
        if request.user.is_superuser:
            return True

        user_role = getattr(request.user, 'role', '').upper()
        allowed_roles = ['CLERK', 'PASTOR', 'ELDER']
        return user_role in allowed_roles or request.user.groups.filter(name__in=allowed_roles).exists()

class WeddingNotificationViewSet(viewsets.ModelViewSet):
    queryset = WeddingNotification.objects.all()
    serializer_class = WeddingNotificationSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # Members can view, leaders can view all
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['create']:
            # Members and Leaders can submit forms
            permission_classes = [permissions.IsAuthenticated]
        else:
            # Update/Delete restricted to Clerks, Pastors, Elders
            permission_classes = [IsChurchLeaderOrClerk]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return WeddingNotification.objects.none()

        user_role = getattr(user, 'role', '').upper()
        leader_roles = ['CLERK', 'PASTOR', 'ELDER']

        # Leaders see all records; Members see only their submitted notifications
        if user.is_superuser or user_role in leader_roles or user.groups.filter(name__in=leader_roles).exists():
            return WeddingNotification.objects.all()
        return WeddingNotification.objects.filter(submitted_by=user)

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(submitted_by=self.request.user)
        else:
            serializer.save()
