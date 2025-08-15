import django_filters
from django_filters import rest_framework as filters
from .models import Product
from django.db.models import Avg, Q
from decimal import Decimal

class ProductFilter(filters.FilterSet):
    # فلاتر متعددة القيم
    category = filters.BaseInFilter(field_name="categories__id", lookup_expr="in")
    option = filters.BaseInFilter(field_name="options__id", lookup_expr="in")
    color = filters.BaseInFilter(field_name="color__id", lookup_expr="in")
    size = filters.BaseInFilter(field_name="size__id", lookup_expr="in")
    
    price_min = filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="price", lookup_expr="lte")
    name = filters.CharFilter(field_name="name", lookup_expr="icontains")

    rating_min = filters.NumberFilter(method='filter_rating_min')
    rating_max = filters.NumberFilter(method='filter_rating_max')
    rating_exact = filters.NumberFilter(method='filter_rating_exact')

    class Meta:
        model = Product
        fields = ['category', 'option', 'price_min', 'price_max', 'name', 'size', 'color', 'rating_min', 'rating_max', 'rating_exact']

    # بقيّة الفلاتر مثل filter_rating_min/max/exact تبقى كما هي
