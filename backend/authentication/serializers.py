# authentication/serializers.py

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['full_name'] = user.get_full_name()
        token['designation'] = user.designation
        token['department_name'] = user.department_name or ''
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'designation': self.user.designation,  
            'department_name': self.user.department_name,
        }
        return data


class UserAdminRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for creating administrative staff (Clerks, Pastors, Elders, etc.)"""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone_number', 
            'first_name', 'last_name', 'designation', 
            'department_name', 'password'
        ]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            phone_number=validated_data.get('phone_number', ''),
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            designation=validated_data['designation'],
            department_name=validated_data.get('department_name', ''),
            password=validated_data['password']
        )
        return user

class CCISTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Inject custom RBAC claims directly from the model field
        token['username'] = user.username
        token['email'] = user.email
        token['full_name'] = user.get_full_name()
        token['designation'] = user.designation 
        token['department_name'] = user.department_name or ''
        token['is_administrative'] = user.is_administrative_user

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Explicit user dictionary returned in the login JSON response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'phone_number': self.user.phone_number or '',
            'designation': self.user.designation,  # FIXED: maps to user.designation
            'department_name': self.user.department_name or '',
            'is_odpc_consented': self.user.is_odpc_consented,
            'is_administrative': self.user.is_administrative_user,
        }

        return data