from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # لا نفعل تحقق CSRF
# authentication.py


from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get('access_token')

        if not raw_token:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token