from djoser.serializers import UserCreateSerializer
from rest_framework import serializers
from .models import CustomUser
from orders.models import  Cart,wishlist,Order
from website.models import Profile
class CustomUserCreateSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        model = CustomUser
        fields = ('id', 'username', 'email', 'password')
        def create(self, validated_data):
            user = super().create(validated_data)
            # إنشاء ملف التعريف Profile تلقائياً عند إنشاء المستخدم
            Cart.objects.create(user=user)
            wishlist.objects.create(user=user)
            Profile.objects.create(
                user=user,
                phone_number="-------------",
                address ="-------------",
            )
            return user



# class OrderUserserializer(serializers.ModelSerializer):
#     class Meta:
#         model = Order
#         fields = ['id','created_at','products','state']