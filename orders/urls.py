# app_name/urls.py
from django.urls import path
from .views import SupplierinquiryView

urlpatterns = [
    path('supplier-inquiry/', SupplierinquiryView.as_view(), name='supplier-inquiry'),
]