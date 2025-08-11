from rest_framework import serializers
from .models import *

class ProductShopSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'old_price', 'discount',
            'description_1', 'image_1',
            'average_rating', 'total_reviews',
            'options', 'categories','sales_count'
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