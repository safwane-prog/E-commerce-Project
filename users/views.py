# Django
from django.contrib.auth import get_user_model, login
from django.contrib.auth.models import update_last_login

# tables
from orders.models import Order ,CartItem,wishlist,wishlistItem
from website.models import Profile
from .models import CustomUser
from .serializers import *

# Django REST Framework
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication, BasicAuthentication

# JWT (SimpleJWT)
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

# Djoser
from djoser.views import UserViewSet


User = get_user_model()

class CustomUserViewSet(UserViewSet):
    def create(self, request, *args, **kwargs):
        # إنشاء المستخدم باستخدام دجوزر
        response = super().create(request, *args, **kwargs)

        if response.status_code == 201:
            # جلب المستخدم الجديد
            user = User.objects.get(username=request.data["username"])
            refresh = RefreshToken.for_user(user)

            # إضافة الكوكيز
            response.set_cookie(
                key="access_token",
                value=str(refresh.access_token),
                httponly=True,
                samesite="Lax",
                path="/",
                max_age=3600,
                secure=False,  # مهم لو عندك بيئة تطوير بدون HTTPS
            )

            response.set_cookie(
                key="refresh_token",
                value=str(refresh),
                httponly=True,
                samesite="Lax",
                path="/",
                max_age=7 * 24 * 3600,
                secure=False,
)



        return response

class CookieTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            refresh = response.data['refresh']
            access = response.data['access']

            # تحقق من المستخدم الحالي من التوكن
            jwt_auth = JWTAuthentication()
            try:
                validated_token = jwt_auth.get_validated_token(access)
                user = jwt_auth.get_user(validated_token)

                # تسجيل دخول المستخدم لجعل @login_required يعمل
                login(request, user)

                # تحديث وقت آخر دخول
                update_last_login(None, user)

                res = Response({
                    'access': access,
                    'refresh': refresh,
                    'message': 'تم تسجيل الدخول بنجاح'
                })

                res.set_cookie('access_token', access, httponly=True, samesite='Lax')
                res.set_cookie('refresh_token', refresh, httponly=True, samesite='Lax')

                return res

            except Exception as e:
                print("JWT Error:", str(e))
                return Response({'detail': 'فشل التحقق من المستخدم'}, status=401)

        return response

class CustomRegisterView(UserViewSet):
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)

        if response.status_code == 201:
            # جلب المستخدم الذي تم إنشاؤه
            user = self.get_queryset().get(username=request.data.get("username"))
            refresh = RefreshToken.for_user(user)
            access = str(refresh.access_token)

            # تسجيل دخول المستخدم (لتفعيل @login_required مثلاً)
            login(request, user)
            update_last_login(None, user)

            res = Response({
                "access": access,
                "refresh": str(refresh),
                "message": "تم التسجيل بنجاح"
            }, status=201)

            # إعداد الكوكيز
            res.set_cookie("access_token", access, httponly=True, samesite="Lax", path="/", secure=False)
            res.set_cookie("refresh_token", str(refresh), httponly=True, samesite="Lax", path="/", secure=False)

            return res
        return response

class LogoutView(APIView):
    def post(self, request):
        res = Response({"message": "تم تسجيل الخروج بنجاح"})
        res.delete_cookie("access_token", path="/")
        res.delete_cookie("refresh_token", path="/")
        return res

class RefreshTokenView(APIView):
    authentication_classes = []  # لا نتحقق من التوكن هنا
    permission_classes = []       # مفتوح

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response({'detail': 'لا يوجد refresh token في الكوكيز'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(refresh_token)
            new_access = str(refresh.access_token)

            # ترجيع الـ access الجديد + تخزينه في الكوكي
            res = Response({'access': new_access}, status=status.HTTP_200_OK)
            res.set_cookie(
                'access_token',
                new_access,
                httponly=True,
                samesite='Lax',
                secure=False,  # خليها True لو HTTPS
                path='/'
            )
            return res

        except TokenError:
            return Response({'detail': 'Refresh token غير صالح أو منتهي'}, status=status.HTTP_401_UNAUTHORIZED)

# class ProfileAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
