from rest_framework import serializers
from .models import *
from orders.models import *
class ProductShopSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()
    in_favorites = serializers.SerializerMethodField()
    in_cart = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'old_price', 'discount',
            'description_1', 'image_1',
            'average_rating', 'total_reviews',
            'options', 'categories', 'sales_count',
            'in_favorites',
            'in_cart',
        ]

    def get_average_rating(self, obj):
        return obj.average_rating()

    def get_total_reviews(self, obj):
        return obj.total_reviews()

    def get_categories(self, obj):
        return [
            {
                "id": category.id,
                "name": category.name,
                "image": category.image.url if category.image else None
            }
            for category in obj.categories.all()
        ]

    def get_options(self, obj):
        return [
            {
                "id": option.id,
                "name": option.name
            }
            for option in obj.options.all()
        ]

    def get_in_favorites(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user = request.user
            # ابحث عن wishlist لهذا المستخدم
            wishlist_obj = wishlist.objects.filter(user=user).first()
            if wishlist_obj:
                return wishlistItem.objects.filter(wishlist=wishlist_obj, product=obj).exists()
        return False

    def get_in_cart(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user = request.user
            # ابحث عن cart لهذا المستخدم (الغير مكتملة أو غير المرتبطة بالطلب)
            cart_obj = Cart.objects.filter(user=user).first()
            if cart_obj:
                return CartItem.objects.filter(
                    cart=cart_obj,
                    product=obj,
                    is_ordered=False
                ).exists()
        return False




class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'image']  # تقدر تعدل الحقول

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['id', 'name']

class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ['id', 'name']

class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ['id', 'name']

class ProductDetileserializers(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    options = OptionSerializer(many=True, read_only=True)
    color = ColorSerializer(many=True, read_only=True)
    size = SizeSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ['id', 'product', 'name', 'email', 'rating', 'review', 'created_at']
        read_only_fields = ['id', 'created_at']