from django.shortcuts import render,get_object_or_404
from django.conf import settings
from .models import StoreHeroImage,StoreSettings
from products.models import *
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from orders.models import *
from .models import *
from users.models import *
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from django.conf import settings

def Base(request):
    user = request.user
    is_user_authenticated = user.is_authenticated
    token_valid = False

    access_token = request.COOKIES.get('access_token')

    if is_user_authenticated and access_token:
        try:
            # فك التوكن للتأكد من صلاحيته
            jwt.decode(access_token, settings.SECRET_KEY, algorithms=["HS256"])
            token_valid = True
        except (ExpiredSignatureError, InvalidTokenError):
            token_valid = False
    else:
        token_valid = False

    logo = StoreSettings.objects.first()
    categories = Category.objects.all()
    currency = settings.CURRENCY_SYMBOL

    context = {
        'logo': logo,
        'categories': categories,
        'currency': currency,
        'user_authenticated': is_user_authenticated and token_valid,
    }
    return context


# Home
def Home(request):
    currency = settings.CURRENCY_SYMBOL
    top_discount_products = Product.objects.filter(discount__gt=0).order_by('-discount')[:5]
    new_products = Product.objects.all().order_by('-created_at')[:10]
    hero_images = StoreHeroImage.objects.all()[:10]
    stars = range(1, 6)

    base_context = Base(request)  # جلب logo

    context = {
        'top_discount_products': top_discount_products,
        'new_products': new_products,
        'currency': currency,
        'stars': stars,
        'hero_images': hero_images,
    }
    context.update(base_context)  # دمج logo مع بقية البيانات
    
    return render(request, 'home.html', context)



# Product_Details
def Product_Details(request,pk):
    product = get_object_or_404(Product, id=pk)
    similar_products = Product.objects.filter(
            categories__in=product.categories.all()
        ).exclude(id=product.id).distinct()[:8]
    base_context = Base(request)  # جلب logo

    context = {
        "similar_products":similar_products
    }
    context.update(base_context)  # دمج logo مع بقية البيانات
    return render(request,'product-details.html',context)

# Shop
def Shop(request):
    base_context = Base(request)  # جلب logo
    categorys = Category.objects.all()
    options = Option.objects.all()
    context = {
        "category": categorys,
        "options": options,  # ✅ تعديل الاسم ليتوافق مع القالب
    }
    context.update(base_context)  # دمج logo مع بقية البيانات
    return render(request, 'shop.html', context)

# contact
def contact(request):
    base_context = Base(request)  # جلب logo
    context = {

    }
    context.update(base_context) 
    return render(request,'contact.html',context)


def Login(request):
    base_context = Base(request)  # جلب logo
    context = {

    }
    context.update(base_context) 
    return render(request,'login.html',context)



def profile(request):
    user = request.user

    profile_user = Profile.objects.filter(user=user).first()
    order_user = Order.objects.filter(user=user)

    # جلب wishlist الخاص بالمستخدم أولاً
    user_wishlist = wishlist.objects.filter(user=user).first()
    if user_wishlist:
        wishlist_user = wishlistItem.objects.filter(wishlist=user_wishlist)
    else:
        wishlist_user = wishlistItem.objects.none()  # مجموعة فارغة

    base_context = Base(request)
    context = {
        'user': user,
        'profile': profile_user,
        'orders': order_user,
        'wishlist': wishlist_user,
    }
    context.update(base_context)

    return render(request, 'profile.html', context)



def cart(request):
    base_context = Base(request)  # جلب logo
    context = {

    }
    context.update(base_context) 
    return render(request, 'cart.html',context)



def checkout(request):
    base_context = Base(request)  # جلب logo
    context = {

    }
    context.update(base_context) 
    return render(request,'checkout.html',context)


def confirmation(request, id):
    base_context = Base(request)  # جلب logo

    order = get_object_or_404(Order, id=id)
    subtotal = sum(float(product.price) for product in order.products.all())
    shipping = 9.99  # مثال ثابت
    tax = subtotal * 0.08  # مثال 8%
    discount = 20.00  # مثال ثابت
    total = subtotal + shipping + tax - discount

    context = {
        'order': order,
        'subtotal': subtotal,
        'shipping': shipping,
        'tax': tax,
        'discount': discount,
        'total': total,
    }
    context.update(base_context)
    return render(request,'Confirmation.html',context)


# ________________________________________________________________________
# 
#                              create api
# ________________________________________________________________________



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from .serializers import ContactSerializer

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import Contact

class ContactCreateAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        foll_name = request.data.get("foll_name")
        email = request.data.get("email")
        subject = request.data.get("subject")
        message = request.data.get("message")

        # تحقق من أن الحقول المطلوبة موجودة
        if not foll_name or not subject or not message:
            return Response({"error": "Please fill in all required fields."}, status=status.HTTP_400_BAD_REQUEST)

        # إذا كان المستخدم مسجّل دخول أضفه
        user = request.user if request.user.is_authenticated else None

        # إنشاء الرسالة
        Contact.objects.create(
            user=user,
            foll_name=foll_name,
            email=email,
            subject=subject,
            message=message
        )

        return Response({"message": "Contact message created successfully"}, status=status.HTTP_201_CREATED)
