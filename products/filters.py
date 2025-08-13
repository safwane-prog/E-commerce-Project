import django_filters
from .models import Product

class ProductFilter(django_filters.FilterSet):
    category = django_filters.NumberFilter(field_name="categories__id", lookup_expr="exact")
    option = django_filters.NumberFilter(field_name="options__id", lookup_expr="exact")
    color = django_filters.NumberFilter(field_name="color__id", lookup_expr="exact")
    size = django_filters.NumberFilter(field_name="size__id", lookup_expr="exact")
    price_min = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    name = django_filters.CharFilter(field_name="name", lookup_expr="icontains")

    class Meta:
        model = Product
        fields = ['category', 'option', 'price_min', 'price_max', 'name','size', 'color']
