from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import CustomUserViewSet

router = DefaultRouter()
router.register("users", CustomUserViewSet, basename="user")

urlpatterns = [
    path("auth/", include(router.urls)),
    path("auth/", include("djoser.urls.jwt")),
]
