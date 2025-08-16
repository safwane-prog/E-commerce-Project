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


from django.contrib.auth import get_user_model, login, logout
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from djoser.views import UserViewSet

User = get_user_model()

class CustomUserViewSet(UserViewSet):
    serializer_class = CustomUserCreateSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        # إنشاء الكوكيز بعد إنشاء المستخدم
        if response.status_code == 201:
            user = CustomUser.objects.get(email=request.data["email"])
            refresh = RefreshToken.for_user(user)
            response.set_cookie(
                key="access_token",
                value=str(refresh.access_token),
                httponly=True,
                samesite="Lax",
                path="/",
                max_age=3600,
                secure=False,
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


class RequestPasswordReset(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get("email")
        try:
            user = User.objects.get(email=email)
            code = get_random_string(6, '0123456789')
            
            # Store code in user model (better than global variable)
            user.password_reset_code = code
            user.save()
            
            send_mail(
                subject="Password Reset Code",
                message=f"Your password reset code is: {code}",
                from_email="noreply@example.com",
                recipient_list=[email],
                fail_silently=False,
            )
            
            return Response({"message": "Reset code sent to email"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Email not found"}, status=status.HTTP_404_NOT_FOUND)

class VerifyResetCode(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")
        
        try:
            user = User.objects.get(email=email)
            if user.password_reset_code == code:
                return Response({"message": "Code verified"}, status=status.HTTP_200_OK)
            return Response({"error": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class ResetPassword(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get("email")
        new_password = request.data.get("new_password")
        
        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.password_reset_code = None
            user.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class CookieTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            access = response.data['access']
            refresh = response.data['refresh']
            
            res = Response({
                'access': access,
                'refresh': refresh,
                'message': 'Login successful'
            })
            
            res.set_cookie(
                'access_token',
                access,
                httponly=True,
                samesite='Lax',
                secure=False,
                max_age=3600
            )
            
            res.set_cookie(
                'refresh_token',
                refresh,
                httponly=True,
                samesite='Lax',
                secure=False,
                max_age=7 * 24 * 3600
            )
            
            return res
        
        return response

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        response = Response({"message": "Logged out successfully"})
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response

class RefreshTokenView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            return Response({'detail': 'No refresh token found'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            refresh = RefreshToken(refresh_token)
            new_access = str(refresh.access_token)
            
            response = Response({'access': new_access}, status=status.HTTP_200_OK)
            response.set_cookie(
                'access_token',
                new_access,
                httponly=True,
                samesite='Lax',
                secure=False,
                max_age=3600
            )
            
            return response
        except TokenError:
            return Response({'detail': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

# views.py
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

class UserProfileDetaile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        Profile.objects.get_or_create(user=user)
        orders = Order.objects.filter(user=user)
        total_spent = sum(float(order.total) for order in orders)

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
