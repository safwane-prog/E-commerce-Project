# Django
from django.contrib.auth import get_user_model, login, logout
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
from rest_framework.permissions import IsAuthenticated,AllowAny
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
    permission_classes = [AllowAny]
    authentication_classes = [SessionAuthentication, BasicAuthentication]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)

        if response.status_code == 201:
            # جلب المستخدم الذي تم إنشاؤه
            user = self.get_queryset().get(username=request.data.get("username"))
            refresh = RefreshToken.for_user(user)
            access = str(refresh.access_token)

            # تسجيل دخول المستخدم
            login(request, user)
            update_last_login(None, user)

            # إنشاء كارت إذا لم يكن موجود
            if not Cart.objects.filter(user=user).exists():
                Cart.objects.create(user=user)

            # إنشاء قائمة رغبات إذا لم تكن موجودة
            wishlist.objects.get_or_create(user=user)

            # إنشاء بروفايل إذا لم يكن موجود
            Profile.objects.get_or_create(
                user=user,
                defaults={
                    "phone_number": "",
                    "address": "",
                    "email": "",
                }
            )

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
        logout(request)
        # إنشاء response وإرسال رسالة
        res = Response({"message": "تم تسجيل الخروج بنجاح"})
        
        # حذف كوكيز التوكن (JWT)
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



# views.py
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

class UserProfileDetaile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        orders = Order.objects.filter(user=user)
        total_spent = sum(
            sum(float(p.price) for p in order.products.all()) for order in orders
        )

        user_wishlist, _ = wishlist.objects.get_or_create(user=user)
        wishlist_count = wishlistItem.objects.filter(wishlist=user_wishlist).count()
        wishlist_user = wishlistItem.objects.filter(wishlist=user_wishlist)

        messages = Contact.objects.filter(user=user)
        data = {
            "order_count": orders.count(),
            "orders": OrderSerializer(orders, many=True, context={"request": request}).data,
            "wishlist_count": wishlist_count,
            "wishlist_items": WishlistItemSerializer(
                wishlist_user, many=True, context={"request": request}
            ).data,
            "messages_count": messages.count(),
            "messages": ContactSerializer(messages, many=True).data,  # هنا بيانات الرسائل كاملة مع الردود
            "total_spent": total_spent,
            "profile": UserSerializer(user, context={"request": request}).data
        }
        return Response(data)


    def post(self, request):
        """
        إضافة أو تحديث تقييم لمنتج
        """
        product_id = request.data.get("product_id")
        rating_value = request.data.get("rating")
        review_text = request.data.get("review", "")

        if not product_id or not rating_value:
            return Response({"error": "product_id and rating are required"}, status=400)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)

        Rating.objects.update_or_create(
            product=product,
            user=request.user,  # مهم جدًا
            defaults={
                "name": request.user.get_full_name() or request.user.username,
                "email": request.user.email,
                "rating": rating_value,
                "review": review_text
            }
        )

        return Response({"message": "Rating saved successfully"})
    def patch(self, request):
            user = request.user
            profile, created = Profile.objects.get_or_create(user=user)


            # تحديث بيانات user
            profile_fields = ['phone_number', 'address', 'city', 'country', 'profile_img','first_name','last_name','email']  # لاحظ هنا عدلت avatar لـ profile_img حسب الحقل الجديد
            for field in profile_fields:
                if field in request.data:
                    if field == 'profile_img' and request.FILES.get('avatar'):
                        setattr(profile, field, request.FILES['avatar'])
                    elif field != 'profile_img':
                        value = request.data.getlist(field)[0]
                        setattr(profile, field, value)
            profile.save()
            print(request.data)
            if profile:
                profile_fields = ['phone_number', 'address', 'city', 'country', 'profile_img', 'first_name', 'last_name','email']
                for field in profile_fields:
                    if field == 'profile_img' and request.FILES.get('profile_img'):
                        setattr(profile, field, request.FILES['profile_img'])
                    elif field != 'profile_img' and field in request.data:
                        setattr(profile, field, request.data[field])
                profile.save()
                print("Profile updated:", profile)
            else:
                profile = Profile.objects.create(
                    user=user,
                    email=request.data.get('email', ''),
                    phone_number=request.data.get('phone_number', ''),
                    address=request.data.get('address', ''),
                    city=request.data.get('city', ''),
                    country=request.data.get('country', ''),
                    profile_img=request.FILES.get('profile_img')
                )

            return Response({"message": "Profile updated successfully"}, status=status.HTTP_200_OK)
