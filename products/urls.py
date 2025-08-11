from django.urls import path
from .views import *

urlpatterns = [
    path('products-list/shop/', ProductShop.as_view(), name='api-products-list'),
    path('details/<str:pk>/', ProductDetail.as_view(), name='products-details'),
    path('product/<str:pk>/stats-description/', ProductRatingStatsAndDescription.as_view(), name='product-stats-description'),
    path('ratings/add/', AddRating.as_view(), name='add-rating'),
]
