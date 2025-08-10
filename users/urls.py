from django.urls import path
from .views import *

urlpatterns = [
    path("auth/jwt/create/", CookieTokenObtainPairView.as_view(), name="token_obtain_pair"),  # تسجيل دخول
    path("auth/users/register/", CustomRegisterView.as_view({"post": "create"}), name="user_register"),  # تسجيل حساب
    path("auth/users/logout/", LogoutView.as_view(), name="logout"),  # تسجيل خروج
    path('auth/jwt/refresh/', RefreshTokenView.as_view(), name='token_refresh'),
]
