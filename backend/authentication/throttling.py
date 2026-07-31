# authentication/throttling.py

from rest_framework.throttling import SimpleRateThrottle

class LoginRateThrottle(SimpleRateThrottle):
    """
    Limits authentication attempts by client IP address.
    Scope defined in settings.py under DEFAULT_THROTTLE_RATES['login'].
    """
    scope = 'login'

    def get_cache_key(self, request, view):
        # Only throttle POST requests to the login endpoint
        if request.method != 'POST':
            return None

        # Return unique identifier based on Client IP Address
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request)
        }