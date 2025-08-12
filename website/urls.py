from django.urls import path
from . import views


urlpatterns = [
    path('',views.Home,name='home'),
    path('product-details/<str:pk>',views.Product_Details,name='Product_Details'),
    path('shop/',views.Shop,name='Shop'),
    path('contact/',views.Contact,name='Contact'),
    path('login/',views.Login,name='login_page'),
    path('profile/',views.Profile,name='profile'),
    path('cart/',views.cart,name='cart_page'),
    path('checkout/',views.checkout,name='checkout'),
    path('confirmation/<str:id>',views.Confirmation,name='Confirmation'),
]