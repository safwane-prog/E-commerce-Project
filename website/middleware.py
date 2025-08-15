# myapp/middleware.py
import jwt
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.conf import settings

class RefreshTokenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        access_token = request.COOKIES.get('access_token')
        refresh_token = request.COOKIES.get('refresh_token')

        if access_token:
            try:
                jwt.decode(access_token, settings.SECRET_KEY, algorithms=["HS256"])
            except jwt.ExpiredSignatureError:
                if refresh_token:
                    try:
                        refresh = RefreshToken(refresh_token)
                        new_access = str(refresh.access_token)
                        request.new_access_token = new_access
                    except TokenError:
                        pass

        response = self.get_response(request)
        if hasattr(request, 'new_access_token'):
            response.set_cookie('access_token', request.new_access_token, httponly=True, samesite='Lax')
        return response
