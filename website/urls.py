from django.urls import path
from . import views
from .views import *


urlpatterns = [
    path('',views.Home,name='home'),
    path('product-details/<str:pk>',views.Product_Details,name='Product_Details'),
    path('shop/',views.Shop,name='Shop'),
    path('contact/',views.contact,name='Contact'),
    path('login/',views.Login,name='login_page'),
    path('profile/',views.profile,name='profile'),
    path('cart/',views.cart,name='cart_page'),
    path('checkout/',views.checkout,name='checkout'),
    path('confirmation/<str:id>',views.confirmation,name='Confirmation'),
    path('about/', views.about, name='about'),  # New about page URL


    # api urls
    path('contact/create/', ContactCreateAPIView.as_view(), name='contact-create'),
]