# app_name/urls.py
from django.urls import path
from .views import *

urlpatterns = [
    path('supplier-inquiry/', SupplierinquiryView.as_view(), name='supplier-inquiry'),
    path('add-to-cart/', Add_To_Cart.as_view(), name='AddToCart'),
    path('add-to-wishlist/', Add_To_Wishlist.as_view(), name='AddToWishlist'),
    path('items-list/cart/', CartItemsViewsBuyUser.as_view(), name='cart-items-list'),
    path('items-list/cart/<int:id>/', CartItemsViewsBuyUser.as_view(), name='cart-items-list'),
]

