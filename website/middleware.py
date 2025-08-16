# users/middleware.py
import jwt
from django.conf import settings
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from jwt import ExpiredSignatureError, InvalidTokenError

class RefreshTokenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        access_token = request.COOKIES.get("access_token")
        refresh_token = request.COOKIES.get("refresh_token")

        if access_token:
            try:
                # تحقق من صلاحية التوكن
                jwt.decode(access_token, settings.SECRET_KEY, algorithms=["HS256"])
            except ExpiredSignatureError:
                # لو انتهت صلاحية التوكن → نجدد باستخدام refresh_token
                if refresh_token:
                    try:
                        jwt_auth = JWTAuthentication()
                        refresh = RefreshToken(refresh_token)
                        new_access_token = str(refresh.access_token)

                        # ضيف التوكن الجديد في الكوكيز
                        request.new_access_token = new_access_token
                        request._refresh_access = True
                    except Exception:
                        pass
            except InvalidTokenError:
                pass

        response = self.get_response(request)

        # لو تم تجديد التوكن → أرجعه في الكوكيز
        if hasattr(request, "_refresh_access") and request._refresh_access:
            response.set_cookie(
                "access_token",
                request.new_access_token,
                httponly=True,
                secure=False,  # خليها True في البروودكشن مع https
                samesite="Lax",
            )
        return response
