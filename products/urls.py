from django.urls import path
from .views import ProductShop

urlpatterns = [
    path('products-list/shop/', ProductShop.as_view(), name='api-products-list'),
]
