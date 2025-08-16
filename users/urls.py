from django.urls import path
from .views import (
    CookieTokenObtainPairView,
    CustomUserViewSet,
    LogoutView,
    RefreshTokenView,
    RequestPasswordReset,
    VerifyResetCode,
    ResetPassword,
    UserProfileDetaile,
)

urlpatterns = [
    path("auth/jwt/create/", CookieTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/users/register/", CustomUserViewSet.as_view({"post": "create"}), name="user_register"),
    path("auth/users/logout/", LogoutView.as_view(), name="logout"),
    path("auth/jwt/refresh/", RefreshTokenView.as_view(), name="token_refresh"),
    path("password-reset/request/", RequestPasswordReset.as_view(), name="password_reset_request"),
    path("password-reset/verify/", VerifyResetCode.as_view(), name="password_reset_verify"),
    path("password-reset/reset/", ResetPassword.as_view(), name="password_reset"),
    path('api/profile/', UserProfileDetaile.as_view(), name='api-profile'),

]