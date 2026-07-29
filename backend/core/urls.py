from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AbsenceApologyViewSet, BaptismViewSet, ChildDedicationViewSet, 
    DepartmentViewSet, ChurchWorkerViewSet, DepartmentalReportViewSet, BulletinViewSet, 
    MeetingViewSet, MeetingAttendanceViewSet, AttendanceSheetUploadViewSet, 
    MemberRecordViewSet, DashboardAnalyticsViewSet, WeddingNotificationViewSet, HolyCommunionViewSet, EventViewSet
)

router = DefaultRouter()
router.register(r'analytics', DashboardAnalyticsViewSet, basename='analytics') # Endpoint: /api/analytics/
router.register(r'baptisms', BaptismViewSet, basename='baptism')
router.register(r'child-dedications', ChildDedicationViewSet, basename='child-dedication')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'church-workers', ChurchWorkerViewSet, basename='church-worker')
router.register(r'departmental-reports', DepartmentalReportViewSet, basename='departmental-report')
router.register(r'bulletins', BulletinViewSet, basename='bulletin')
router.register(r'meetings', MeetingViewSet, basename='meeting')
router.register(r'meeting-attendances', MeetingAttendanceViewSet, basename='meeting-attendance')
router.register(r'attendance-sheets', AttendanceSheetUploadViewSet, basename='attendance-sheet')
router.register(r'absence-apologies', AbsenceApologyViewSet, basename='absence-apology')
router.register(r'member-records', MemberRecordViewSet, basename='member-record')
router.register(r'weddings', WeddingNotificationViewSet, basename='wedding')
router.register(r'holy-communion', HolyCommunionViewSet, basename='holy-communion')
router.register(r'events', EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
]