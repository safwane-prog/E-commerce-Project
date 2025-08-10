from rest_framework import generics
from rest_framework.permissions import AllowAny
from django.db.models import Q
from .models import Product
from .serializers import ProductShopSerializer
from rest_framework.pagination import PageNumberPagination

# إعداد الباجينشن
class ProductPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

class ProductShop(generics.ListAPIView):
    serializer_class = ProductShopSerializer
    permission_classes = [AllowAny]
    pagination_class = ProductPagination

    def get_queryset(self):
        queryset = Product.objects.all().order_by('-created_at')

        # جلب القيم من البارامترات
        category_id = self.request.query_params.get('category')
        option_id = self.request.query_params.get('option')
        price_min = self.request.query_params.get('price_min')
        price_max = self.request.query_params.get('price_max')
        name = self.request.query_params.get('name')

        # فلترة حسب الفئة
        if category_id:
            queryset = queryset.filter(categories__id=category_id)

        # فلترة حسب الخيار
        if option_id:
            queryset = queryset.filter(options__id=option_id)

        # فلترة حسب السعر الأدنى
        if price_min:
            queryset = queryset.filter(price__gte=price_min)

        # فلترة حسب السعر الأقصى
        if price_max:
            queryset = queryset.filter(price__lte=price_max)

        # فلترة حسب الاسم (بحث جزئي)
        if name:
            queryset = queryset.filter(name__icontains=name)

        return queryset.distinct()
