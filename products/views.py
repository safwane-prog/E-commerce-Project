from rest_framework import generics
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination
from .models import Product
from .serializers import ProductShopSerializer
from .filters import ProductFilter  # الفلتر الذي كتبناه

class ProductPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

class ProductShop(generics.ListAPIView):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductShopSerializer
    permission_classes = [AllowAny]
    pagination_class = ProductPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProductFilter
