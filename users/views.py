from djoser.views import UserViewSet
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

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
                samesite="Lax"
            )
            response.set_cookie(
                key="refresh_token",
                value=str(refresh),
                httponly=True,
                samesite="Lax"
            )

        return response
