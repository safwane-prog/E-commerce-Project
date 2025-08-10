# app_name/urls.py
from django.urls import path
from .views import *

urlpatterns = [
    path('supplier-inquiry/', SupplierinquiryView.as_view(), name='supplier-inquiry'),
    path('add-to-cart/', Add_To_Cart.as_view(), name='AddToCart'),
]