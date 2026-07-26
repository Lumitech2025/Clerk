# core/views.py

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


# Import your custom RBAC permissions
from authentication.permissions import IsChurchClerk, IsPastoralTeam

from .models import BaptismRecord, ChildDedication
from .serializers import BaptismSerializer, ChildDedicationSerializer
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



