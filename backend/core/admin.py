from django.contrib import admin
from .models import BaptismRecord, ChildDedication

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