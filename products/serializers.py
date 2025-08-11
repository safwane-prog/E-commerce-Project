from rest_framework import serializers
from .models import Product

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
            'options', 'categories'
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


class ProductDetileserializers(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'