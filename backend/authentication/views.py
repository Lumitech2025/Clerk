from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CCISTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Inject custom RBAC claims into the JWT token payload
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = getattr(user, 'role', 'MEMBER')
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'username': self.user.username,
            'email': self.user.email,
            'role': getattr(self.user, 'role', 'MEMBER'),
        }
        return data

class CCISLoginView(TokenObtainPairView):
    serializer_class = CCISTokenObtainPairSerializer