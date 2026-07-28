# core/views.py

from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth

from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend


MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


# Models
from .models import (
    MemberRecord, BaptismRecord, ChildDedication,
    WeddingNotification, Department, DepartmentalReport,
    Bulletin, Meeting, MeetingAttendance, AttendanceSheetUpload,
    AbsenceApology, HolyCommunion, Event
)

# Serializers
from .serializers import (
    MemberRecordSerializer, BaptismSerializer, ChildDedicationSerializer,
    WeddingNotificationSerializer, DepartmentSerializer, DepartmentalReportSerializer,
    BulletinSerializer, MeetingSerializer, MeetingAttendanceSerializer,
    AttendanceSheetUploadSerializer, AbsenceApologySerializer, DashboardAnalyticsSerializer, HolyCommunionSerializer, EventSerializer
)

# Services
from .services import (
    send_welcome_baptism_notifications, 
    send_certificate_reminder_notifications,
    send_welcome_dedication_notifications,
    send_dedication_certificate_reminder_notifications
)

# Centralized Role Extraction Helper
def get_user_role(user):
    """
    Safely retrieves and normalizes the user's designation string 
    from the Newlife CCIS custom User model.
    """
    if not user or not user.is_authenticated:
        return ""
    
    # Primary check: user.designation (from your models.py)
    # Fallback check: user.role (in case of legacy/profile models)
    designation = (
        getattr(user, 'designation', None) 
        or getattr(user, 'role', None) 
        or getattr(getattr(user, 'profile', None), 'role', '')
    )
    
    return str(designation).upper().strip()

# --- CUSTOM PERMISSION CLASSES ---

class IsChurchClerk(permissions.BasePermission):
    """Restricts write access strictly to Church Clerks and Superusers."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return get_user_role(request.user) in ['CLERK', 'CHURCH_CLERK']


class IsLeadershipReadOnlyOrClerkWrite(permissions.BasePermission):
    """
    Clerk: Full Read/Write
    Pastors/Elders: Read-Only
    Others: Denied
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        role = get_user_role(request.user)
        if role in ['CLERK', 'CHURCH_CLERK']:
            return True
        if request.method in permissions.SAFE_METHODS and role in ['PASTOR', 'ELDER']:
            return True
        return False


class IsCommunicationOrClerk(permissions.BasePermission):
    """Allows Clerks and Communication Team to publish updates and bulletins."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        role = get_user_role(request.user)
        if request.method in permissions.SAFE_METHODS:
            return True
        return role in ['CLERK', 'CHURCH_CLERK', 'COMMUNICATION']


class IsClerkOrPastorOrElder(permissions.BasePermission):
    """Full pastoral & governance oversight permission class."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        role = get_user_role(request.user)
        allowed = ['CLERK', 'CHURCH_CLERK', 'PASTOR', 'ELDER', 'ADMIN']
        return role in allowed or request.user.groups.filter(name__iregex=r'^(clerk|pastor|elder|admin)s?$').exists()


# --- PAGINATION ---

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


# --- VIEWSETS ---

class MemberRecordViewSet(viewsets.ModelViewSet):
    """Central Membership Roll."""
    queryset = MemberRecord.objects.all()
    serializer_class = MemberRecordSerializer
    permission_classes = [IsLeadershipReadOnlyOrClerkWrite]
    pagination_class = StandardResultsSetPagination
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['year_joined', 'joining_method', 'gender', 'transfer_status', 'is_active']
    search_fields = ['full_name', 'phone_number', 'email', 'origin_church']
    ordering_fields = ['full_name', 'year_joined', 'created_at']


class BaptismViewSet(viewsets.ModelViewSet):
    """Official church baptism records."""
    queryset = BaptismRecord.objects.all().order_by('-created_at')
    serializer_class = BaptismSerializer
    permission_classes = [IsAuthenticated, IsLeadershipReadOnlyOrClerkWrite]

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        send_welcome_baptism_notifications(instance)

    @action(detail=True, methods=['post'], url_path='send-reminder', permission_classes=[IsAuthenticated, IsChurchClerk])
    def send_reminder(self, request, pk=None):
        baptism = self.get_object()
        send_certificate_reminder_notifications(baptism)
        return Response(
            {"message": f"Reminder successfully sent to {baptism.full_name} via SMS and Email."},
            status=status.HTTP_200_OK
        )


class ChildDedicationViewSet(viewsets.ModelViewSet):
    """Child Dedications registry."""
    queryset = ChildDedication.objects.all().order_by('-created_at')
    serializer_class = ChildDedicationSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create']:
            return [IsAuthenticated()]
        return [IsClerkOrPastorOrElder()]

    def get_queryset(self):
        user = self.request.user
        role = get_user_role(user)
        base_qs = ChildDedication.objects.all()

        if user.is_superuser or role in ['CLERK', 'CHURCH_CLERK', 'PASTOR', 'ELDER']:
            search = self.request.query_params.get('search', None)
            status_param = self.request.query_params.get('status', None)

            if search:
                base_qs = base_qs.filter(
                    Q(child_name__icontains=search) |
                    Q(father_name__icontains=search) |
                    Q(mother_name__icontains=search) |
                    Q(officiating_pastor__icontains=search) |
                    Q(phone__icontains=search)
                )

            if status_param and status_param != 'All':
                base_qs = base_qs.filter(status=status_param)

            return base_qs

        # Regular members see dedications they submitted or are associated with
        return base_qs.filter(Q(submitted_by=user) | Q(parent_email=user.email)).distinct()

    def perform_create(self, serializer):
        dedication = serializer.save()
        send_welcome_dedication_notifications(dedication)

    @action(detail=True, methods=['post'], url_path='send-reminder', permission_classes=[IsClerkOrPastorOrElder])
    def send_reminder(self, request, pk=None):
        dedication = self.get_object()
        send_dedication_certificate_reminder_notifications(dedication)
        return Response({
            "message": f"Reminder notifications dispatched to parents of {dedication.child_name}."
        }, status=status.HTTP_200_OK)


class WeddingNotificationViewSet(viewsets.ModelViewSet):
    """Marriage notifications and officiating roster."""
    serializer_class = WeddingNotificationSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsClerkOrPastorOrElder]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return WeddingNotification.objects.none()

        role = get_user_role(user)
        leader_roles = ['CLERK', 'CHURCH_CLERK', 'PASTOR', 'ELDER', 'ADMIN']

        is_leader = (
            user.is_superuser 
            or role in leader_roles 
            or user.groups.filter(name__iregex=r'^(clerk|pastor|elder|admin)s?$').exists()
        )

        base_qs = WeddingNotification.objects.select_related('submitted_by').all()

        if is_leader:
            return base_qs.order_by('-id')

        return base_qs.filter(submitted_by=user).order_by('-id')

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(submitted_by=self.request.user)
        else:
            serializer.save()


class DepartmentViewSet(viewsets.ModelViewSet):
    """Church departments master list."""
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'leader']
    ordering_fields = ['name', 'created_at']


class DepartmentalReportViewSet(viewsets.ModelViewSet):
    """Quarterly and monthly departmental reports."""
    queryset = DepartmentalReport.objects.all()
    serializer_class = DepartmentalReportSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'report_type']
    search_fields = ['title', 'department__name']
    ordering_fields = ['date', 'uploaded_at']

    def get_queryset(self):
        user = self.request.user
        role = get_user_role(user)
        base_qs = DepartmentalReport.objects.all()

        if user.is_superuser or role in ['CLERK', 'CHURCH_CLERK', 'PASTOR', 'ELDER']:
            return base_qs

        if role == 'DEPARTMENT_LEADER':
            return base_qs.filter(department__leader=user)

        return DepartmentalReport.objects.none()


class BulletinViewSet(viewsets.ModelViewSet):
    """Weekly Sabbath bulletins."""
    queryset = Bulletin.objects.all().order_by('-sabbath_date')
    serializer_class = BulletinSerializer
    permission_classes = [IsCommunicationOrClerk]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    @action(detail=True, methods=['get'])
    def whatsapp_payload(self, request, pk=None):
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
        bulletin = self.get_object()
        bulletin.whatsapp_sent = True
        bulletin.whatsapp_sent_at = timezone.now()
        bulletin.save()
        return Response({'status': 'marked as sent', 'whatsapp_sent_at': bulletin.whatsapp_sent_at})


class MeetingViewSet(viewsets.ModelViewSet):
    """Church Business & Board Meetings."""
    queryset = Meeting.objects.all().order_by('-date')
    serializer_class = MeetingSerializer
    permission_classes = [IsClerkOrPastorOrElder]

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
        year = request.query_params.get('year', timezone.now().year)
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
    permission_classes = [IsClerkOrPastorOrElder]


class AttendanceSheetUploadViewSet(viewsets.ModelViewSet):
    queryset = AttendanceSheetUpload.objects.all().order_by('-uploaded_at')
    serializer_class = AttendanceSheetUploadSerializer
    permission_classes = [IsClerkOrPastorOrElder]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sheet_instance = serializer.save()

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
    """Apologies for board/business meeting absences."""
    queryset = AbsenceApology.objects.all().order_by('-submitted_at')
    serializer_class = AbsenceApologySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        apology = serializer.save()
        MeetingAttendance.objects.update_or_create(
            meeting=apology.meeting,
            member_name=apology.member_name,
            defaults={
                'department': apology.department,
                'status': 'AA'
            }
        )


class DashboardAnalyticsViewSet(viewsets.ViewSet):
    """Deliver core dashboard summary metrics & trend analytics for Church Leadership."""
    permission_classes = [IsClerkOrPastorOrElder]

    def list(self, request):
        current_year = timezone.now().year
        today = timezone.localtime(timezone.now()).date()

        event_viewset = EventViewSet()
        event_viewset.request = request
        visible_events = event_viewset.get_queryset()

        upcoming_events_count = visible_events.filter(start_date__gte=today).count()

        # 1. Top KPI Metrics
        total_active_members = MemberRecord.objects.filter(is_active=True).count()
        baptisms_ytd = BaptismRecord.objects.filter(baptism_date__year=current_year).count()
        child_dedications_total = ChildDedication.objects.count()
        
        pending_transfers = MemberRecord.objects.filter(
            ~Q(transfer_status='2nd Reading / Transfer Granted'),
            transfer_status__isnull=False
        ).count()

        upcoming_events_count = Event.objects.filter(start_date__gte=today).count()

        # 2. Monthly Monthly Metrics Aggregation (Baptisms, Transfers In, Transfers Out)
        baptism_counts = [0] * 12
        transfers_in_counts = [0] * 12
        transfers_out_counts = [0] * 12

        # Baptisms
        baptisms_query = (
            BaptismRecord.objects.filter(baptism_date__year=current_year)
            .annotate(month=TruncMonth('baptism_date'))
            .values('month')
            .annotate(count=Count('id'))
        )
        for entry in baptisms_query:
            if entry['month']:
                idx = entry['month'].month - 1
                baptism_counts[idx] = entry['count']

        # Transfers In
        transfers_in_query = (
            MemberRecord.objects.filter(
                date_joined__year=current_year,
                joining_method='Transfer',
                transfer_type='Transfer In'
            )
            .annotate(month=TruncMonth('date_joined'))
            .values('month')
            .annotate(count=Count('id'))
        )
        for entry in transfers_in_query:
            if entry['month']:
                idx = entry['month'].month - 1
                transfers_in_counts[idx] = entry['count']

        # Transfers Out
        transfers_out_query = (
            MemberRecord.objects.filter(
                updated_at__year=current_year,
                transfer_type='Transfer Out'
            )
            .annotate(month=TruncMonth('updated_at'))
            .values('month')
            .annotate(count=Count('id'))
        )
        for entry in transfers_out_query:
            if entry['month']:
                idx = entry['month'].month - 1
                transfers_out_counts[idx] = entry['count']

        # Format Chart Payload
        monthly_metrics = []
        for i in range(12):
            monthly_metrics.append({
                'month': MONTH_NAMES[i],
                'Baptisms': baptism_counts[i],
                'TransfersIn': transfers_in_counts[i],
                'TransfersOut': transfers_out_counts[i]
            })

        analytics_data = {
            'total_active_members': total_active_members,
            'baptisms_ytd': baptisms_ytd,
            'child_dedications_total': child_dedications_total,
            'pending_transfers': pending_transfers,
            'upcoming_events_count': upcoming_events_count,
            'monthly_metrics': monthly_metrics,
            'membership_transfers': {
                'incoming': sum(transfers_in_counts),
                'outgoing': sum(transfers_out_counts),
            },
            'baptism_trends': {
                'year': current_year,
                'monthly_counts': baptism_counts
            }
        }

        serializer = DashboardAnalyticsSerializer(analytics_data)
        return Response(serializer.data, status=status.HTTP_200_OK)



class HolyCommunionViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for viewing, creating, updating, and deleting Holy Communion quarterly records.
    Supports file uploads (`MultipartParser`) and filtering by `year` and `quarter`.
    """
    queryset = HolyCommunion.objects.all()
    serializer_class = HolyCommunionSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Extract query parameters sent from React frontend
        year = self.request.query_params.get('year', None)
        quarter = self.request.query_params.get('quarter', None)

        if year:
            queryset = queryset.filter(year=year)
        if quarter and quarter != 'ALL':
            queryset = queryset.filter(quarter=quarter)

        return queryset

    def perform_create(self, serializer):
        # Automatically attach logged-in clerk to the record
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(recorded_by=self.request.user)
        else:
            serializer.save()

    def perform_update(self, serializer):
        serializer.save()


class RoleBasedEventAccessPermission(permissions.BasePermission):
    """
    Custom Permission:
    - Anyone authenticated can view events allowed by their role.
    - Only Clerks, Pastors, and Admins can create/edit/delete events.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated

        user = request.user
        user_role = getattr(user, 'role', None)  # Assumes custom User model with role field
        
        return (
            user.is_staff or 
            user.is_superuser or 
            user_role in ['CHURCH_CLERK', 'PASTOR']
        )


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [RoleBasedEventAccessPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    filterset_fields = ['event_type', 'target_audience', 'status', 'is_multi_day']
    search_fields = ['title', 'description', 'venue', 'organizer', 'groom_name', 'bride_name']
    ordering_fields = ['start_date', 'start_time', 'created_at']
    ordering = ['start_date', 'start_time']

    @action(detail=False, methods=['get'], url_path='upcoming', pagination_class=None)
    def upcoming(self, request):
        """Returns unpaginated list of upcoming events visible to the current user."""
        # Use local date to avoid UTC boundary drops
        today = timezone.localtime(timezone.now()).date()
        
        # get_queryset() ensures Role-Based Access Control filters are respected
        queryset = self.get_queryset().filter(start_date__gte=today).order_by('start_date', 'start_time')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        user = self.request.user

        # Superusers and Clerks/Pastors see everything
        if user.is_staff or user.is_superuser:
            return Event.objects.all()

        user_role = get_user_role(user)

        # Define visibility mapping based on user role
        allowed_audiences = [Event.TargetAudience.ALL]

        if user_role in ['CHURCH_CLERK', 'PASTOR']:
            return Event.objects.all()
        elif user_role == 'ELDER':
            allowed_audiences.extend([Event.TargetAudience.ELDERS, Event.TargetAudience.BOARD, Event.TargetAudience.LEADERS])
        elif user_role == 'BOARD_MEMBER':
            allowed_audiences.extend([Event.TargetAudience.BOARD, Event.TargetAudience.LEADERS])
        elif user_role == 'DEPARTMENT_LEADER':
            allowed_audiences.append(Event.TargetAudience.LEADERS)

        # Filter timeframe if specified
        timeframe = self.request.query_params.get('timeframe')
        qs = Event.objects.filter(target_audience__in=allowed_audiences)

        if timeframe == 'upcoming':
            from django.utils import timezone
            qs = qs.filter(start_date__gte=timezone.now().date())

        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)