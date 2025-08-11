from djoser.serializers import UserCreateSerializer
from .models import CustomUser
from orders.models import  Cart,wishlist
from website.models import Profile
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
            )
            return user



