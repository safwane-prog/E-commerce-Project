import django_filters
from django.db.models import Avg, Q
from .models import Product
from decimal import Decimal

class ProductFilter(django_filters.FilterSet):
    # فلاتر أساسية
    category = django_filters.NumberFilter(field_name="categories__id", lookup_expr="exact")
    option = django_filters.NumberFilter(field_name="options__id", lookup_expr="exact")
    color = django_filters.NumberFilter(field_name="color__id", lookup_expr="exact")
    size = django_filters.NumberFilter(field_name="size__id", lookup_expr="exact")
    price_min = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    name = django_filters.CharFilter(field_name="name", lookup_expr="icontains")

    # فلاتر التقييم
    rating_min = django_filters.NumberFilter(method='filter_rating_min')
    rating_max = django_filters.NumberFilter(method='filter_rating_max')
    rating_exact = django_filters.NumberFilter(method='filter_rating_exact')

    class Meta:
        model = Product
        fields = ['category', 'option', 'price_min', 'price_max', 'name', 'size', 'color', 'rating_min', 'rating_max', 'rating_exact']

    def filter_rating_min(self, queryset, name, value):
        if value is not None:
            queryset = queryset.annotate(avg_rating=Avg('ratings__rating'))
            return queryset.filter(Q(avg_rating__gte=value) | Q(avg_rating__isnull=True)).distinct()
        return queryset

    def filter_rating_max(self, queryset, name, value):
        if value is not None:
            queryset = queryset.annotate(avg_rating=Avg('ratings__rating'))
            return queryset.filter(Q(avg_rating__lte=value) | Q(avg_rating__isnull=True)).distinct()
        return queryset


    def filter_rating_exact(self, queryset, name, value):
        if value is not None:
            min_rating = value - Decimal('0.5')
            max_rating = value + Decimal('0.5')
            queryset = queryset.annotate(avg_rating=Avg('ratings__rating'))
            return queryset.filter(avg_rating__gte=min_rating, avg_rating__lt=max_rating).distinct()
        return queryset



    @property
    def qs(self):
        parent = super().qs
        return parent.annotate(
            avg_rating=Avg('ratings__rating')
        ).distinct()


