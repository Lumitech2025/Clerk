import json
from django.utils import timezone
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth

from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

# --- MODELS ---
from .models import (
    MemberRecord, BaptismRecord, ChildDedication,
    WeddingNotification, Department, DepartmentRole, ChurchWorker, DepartmentalReport,
    Bulletin, Meeting, MeetingAttendance, AttendanceSheetUpload,
    AbsenceApology, HolyCommunion, Event, DepartmentalEvent, 
    DepartmentalMeetingAttendance, DepartmentalMeeting
)

# --- SERIALIZERS ---
from .serializers import (
    MemberRecordSerializer, BaptismSerializer, ChildDedicationSerializer,
    WeddingNotificationSerializer, DepartmentSerializer, DepartmentRoleSerializer,
    ChurchWorkerSerializer, DepartmentalReportSerializer, BulletinSerializer, 
    MeetingSerializer, MeetingAttendanceSerializer, AttendanceSheetUploadSerializer, 
    AbsenceApologySerializer, DashboardAnalyticsSerializer, HolyCommunionSerializer, 
    EventSerializer, DepartmentalEventSerializer, DepartmentalMeetingAttendanceSerializer, 
    DepartmentalMeetingSerializer
)

# --- CENTRALIZED PERMISSIONS ---
from authentication.permissions import (
    get_user_role,
    IsChurchClerk,
    IsLeadershipReadOnlyOrClerkWrite,
    IsCommunicationOrClerk,
    IsClerkOrPastorOrElder,
    DepartmentalReportPermission,
    CanManageDepartmentEvents,
    IsDepartmentLeaderOrLeadershipForMeeting,
    RoleBasedEventAccessPermission
)

# --- SERVICES ---
from .services import (
    send_welcome_baptism_notifications, 
    send_certificate_reminder_notifications,
    send_welcome_dedication_notifications,
    send_dedication_certificate_reminder_notifications
)


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
    parser_classes = (MultiPartParser, FormParser, JSONParser)  # Enforces file upload handling
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'gender', 'baptism_date']
    search_fields = ['full_name', 'phone', 'email', 'officiating_pastor', 'cbm_minute_no']
    ordering_fields = ['baptism_date', 'full_name', 'created_at']

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
    search_fields = ['name', 'leader', 'leader_phone']
    ordering_fields = ['name', 'created_at']


class ChurchWorkerViewSet(viewsets.ModelViewSet):
    """Church Workers & Council Phone Contacts management."""
    queryset = ChurchWorker.objects.all()
    serializer_class = ChurchWorkerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['worker_type', 'department', 'is_active']
    search_fields = ['full_name', 'designation', 'phone_number', 'email']
    ordering_fields = ['full_name', 'designation', 'created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsChurchClerk()]


class DepartmentalReportViewSet(viewsets.ModelViewSet):
    """
    Centralized archive for departmental reports.
    All authenticated roles can view all uploaded reports.
    """
    queryset = DepartmentalReport.objects.all().select_related('department').order_by('-date')
    serializer_class = DepartmentalReportSerializer
    permission_classes = [IsAuthenticated, DepartmentalReportPermission]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'report_type']
    search_fields = ['title', 'department__name']
    ordering_fields = ['date', 'uploaded_at']

    def get_queryset(self):
        user = self.request.user
        role = get_user_role(user)

        viewable_roles = [
            'CLERK', 'CHURCH_CLERK', 
            'PASTOR', 
            'ELDER', 
            'COMMUNICATION', 
            'DEPARTMENT_LEADER', 'DEPT_LEADER', 
            'MEMBER'
        ]

        if user.is_superuser or role in viewable_roles:
            return DepartmentalReport.objects.all().select_related('department').order_by('-date')

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
            f"Blessed Sabbath! 🙏"
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

        total_active_members = MemberRecord.objects.filter(is_active=True).count()
        baptisms_ytd = BaptismRecord.objects.filter(baptism_date__year=current_year).count()
        child_dedications_total = ChildDedication.objects.count()
        
        pending_transfers = MemberRecord.objects.filter(
            ~Q(transfer_status='2nd Reading / Transfer Granted'),
            transfer_status__isnull=False
        ).count()

        upcoming_events_count = Event.objects.filter(start_date__gte=today).count()

        baptism_counts = [0] * 12
        transfers_in_counts = [0] * 12
        transfers_out_counts = [0] * 12

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
    """
    queryset = HolyCommunion.objects.all()
    serializer_class = HolyCommunionSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        year = self.request.query_params.get('year', None)
        quarter = self.request.query_params.get('quarter', None)

        if year:
            queryset = queryset.filter(year=year)
        if quarter and quarter != 'ALL':
            queryset = queryset.filter(quarter=quarter)

        return queryset

    def perform_create(self, serializer):
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(recorded_by=self.request.user)
        else:
            serializer.save()

    def perform_update(self, serializer):
        serializer.save()


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
        today = timezone.localtime(timezone.now()).date()
        queryset = self.get_queryset().filter(start_date__gte=today).order_by('start_date', 'start_time')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        user = self.request.user

        if user.is_staff or user.is_superuser:
            return Event.objects.all()

        user_role = get_user_role(user)

        allowed_audiences = [Event.TargetAudience.ALL]

        if user_role in ['CHURCH_CLERK', 'PASTOR']:
            return Event.objects.all()
        elif user_role == 'ELDER':
            allowed_audiences.extend([Event.TargetAudience.ELDERS, Event.TargetAudience.BOARD, Event.TargetAudience.LEADERS])
        elif user_role == 'BOARD_MEMBER':
            allowed_audiences.extend([Event.TargetAudience.BOARD, Event.TargetAudience.LEADERS])
        elif user_role == 'DEPARTMENT_LEADER':
            allowed_audiences.append(Event.TargetAudience.LEADERS)

        timeframe = self.request.query_params.get('timeframe')
        qs = Event.objects.filter(target_audience__in=allowed_audiences)

        if timeframe == 'upcoming':
            qs = qs.filter(start_date__gte=timezone.now().date())

        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class DepartmentalEventViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Departmental Events."""
    queryset = DepartmentalEvent.objects.all().select_related('department')
    serializer_class = DepartmentalEventSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageDepartmentEvents]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'status', 'start_date']
    search_fields = ['title', 'description', 'venue', 'leader_in_charge', 'department__name']
    ordering_fields = ['start_date', 'start_time', 'created_at']
    ordering = ['start_date', 'start_time']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return DepartmentalEvent.objects.none()

        role = get_user_role(user)
        base_qs = DepartmentalEvent.objects.select_related('department').all()

        if user.is_superuser or role in ['CLERK', 'CHURCH_CLERK', 'PASTOR', 'ELDER', 'ADMIN']:
            return base_qs

        if role in ['DEPT_LEADER', 'DEPARTMENT_LEADER']:
            return base_qs.filter(
                Q(department__leader__icontains=user.get_full_name() or user.username) |
                Q(created_by=user) |
                Q(status=DepartmentalEvent.EventStatus.APPROVED) |
                Q(status=DepartmentalEvent.EventStatus.PROPOSED)
            ).distinct()

        return base_qs.filter(status__in=[
            DepartmentalEvent.EventStatus.APPROVED,
            DepartmentalEvent.EventStatus.ONGOING,
            DepartmentalEvent.EventStatus.COMPLETED
        ])

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='approve', permission_classes=[IsClerkOrPastorOrElder])
    def approve_event(self, request, pk=None):
        """Action for Clerk/Pastor/Elder to formally approve a proposed event."""
        event = self.get_object()
        event.status = DepartmentalEvent.EventStatus.APPROVED
        event.save()
        return Response({
            'status': 'Approved',
            'message': f"Departmental event '{event.title}' has been approved successfully."
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='upcoming')
    def upcoming(self, request):
        """Action to list upcoming approved/proposed departmental events."""
        today = timezone.localtime(timezone.now()).date()
        qs = self.get_queryset().filter(
            start_date__gte=today,
            status__in=[DepartmentalEvent.EventStatus.APPROVED, DepartmentalEvent.EventStatus.PROPOSED]
        ).order_by('start_date', 'start_time')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DepartmentalMeetingViewSet(viewsets.ModelViewSet):
    """API ViewSet for managing Departmental Meetings."""
    queryset = DepartmentalMeeting.objects.all().select_related('department')
    serializer_class = DepartmentalMeetingSerializer
    permission_classes = [permissions.IsAuthenticated, IsDepartmentLeaderOrLeadershipForMeeting]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'status', 'date']
    search_fields = ['title', 'meeting_ref', 'venue', 'chairperson', 'secretary', 'department__name']
    ordering_fields = ['date', 'start_time', 'created_at']
    ordering = ['-date', '-start_time']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return DepartmentalMeeting.objects.none()

        role = get_user_role(user)
        base_qs = DepartmentalMeeting.objects.select_related('department').all()

        if user.is_superuser or role in ['CLERK', 'CHURCH_CLERK', 'PASTOR', 'ELDER', 'ADMIN', 'COMMUNICATION']:
            return base_qs

        if role in ['DEPT_LEADER', 'DEPARTMENT_LEADER']:
            return base_qs.filter(
                Q(department__leader__icontains=user.get_full_name() or user.username) |
                Q(created_by=user)
            ).distinct()

        return base_qs

    def perform_create(self, serializer):
        meeting = serializer.save(created_by=self.request.user)
        
        members_present_raw = self.request.data.get('members_present')
        if members_present_raw:
            try:
                members_list = json.loads(members_present_raw) if isinstance(members_present_raw, str) else members_present_raw
                attendance_objects = [
                    DepartmentalMeetingAttendance(
                        meeting=meeting,
                        member_name=item.get('name'),
                        status='PR'
                    )
                    for item in members_list if item.get('name')
                ]
                DepartmentalMeetingAttendance.objects.bulk_create(attendance_objects)
            except (json.JSONDecodeError, TypeError, ValueError):
                pass


class DepartmentalMeetingAttendanceViewSet(viewsets.ModelViewSet):
    """API ViewSet for managing attendance records for departmental meetings."""
    queryset = DepartmentalMeetingAttendance.objects.all()
    serializer_class = DepartmentalMeetingAttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['meeting', 'status']
    search_fields = ['member_name']