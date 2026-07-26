from rest_framework import serializers
from .models import BaptismRecord, ChildDedication

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