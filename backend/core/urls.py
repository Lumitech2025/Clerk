from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BaptismViewSet, ChildDedicationViewSet

router = DefaultRouter()
router.register(r'baptisms', BaptismViewSet, basename='baptism')
router.register(r'child-dedications', ChildDedicationViewSet, basename='child-dedication')

urlpatterns = [
    path('', include(router.urls)),
]