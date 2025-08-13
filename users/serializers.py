from djoser.serializers import UserCreateSerializer
from rest_framework import serializers
from .models import CustomUser
from orders.models import  *
from website.models import *
from products.models import *
from django.contrib.auth import get_user_model, login
User = get_user_model()

class CustomUserCreateSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        model = CustomUser
        fields = ('id', 'username', 'email', 'password')
        def create(self, validated_data):
            user = super().create(validated_data)
            Cart.objects.create(user=user)
            wishlist.objects.create(user=user)
            Profile.objects.create(
                user=user,
                phone_number="-------------",
                address ="-------------",
                email ="-------------",
            )
            return user

# serializers.py
class ProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    is_rated_by_user = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = "__all__"

    def get_image(self, obj):
        request = self.context.get("request")
        if request and obj.image_1:
            return request.build_absolute_uri(obj.image_1.url)
        return obj.image_1.url if obj.image_1 else None

    def get_is_rated_by_user(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        # الآن الفلترة على user الصحيح
        return obj.ratings.filter(user=request.user).exists()



class OrderSerializer(serializers.ModelSerializer):
    products = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = "__all__"

    def get_products(self, obj):
        request = self.context.get("request")
        return ProductSerializer(obj.products.all(), many=True, context={"request": request}).data


class WishlistItemSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()

    class Meta:
        model = wishlistItem
        fields = "__all__"

    def get_product(self, obj):
        request = self.context.get("request")
        return ProductSerializer(obj.product, context={"request": request}).data


class AdminReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminRepliedForContactMessage
        fields = "__all__"


class ContactSerializer(serializers.ModelSerializer):
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = "__all__"

    def get_replies(self, obj):
        replies = AdminRepliedForContactMessage.objects.filter(contact=obj)
        return AdminReplySerializer(replies, many=True).data



class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = "__all__"


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = "__all__"

