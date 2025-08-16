from django.shortcuts import render,get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import StoreHeroImage,StoreSettings
from products.models import *
from rest_framework.views import APIView
from orders.models import *
from .models import *
from users.models import *
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from django.conf import settings
from django.db.models import Avg, Count
from math import floor
from django.conf.urls import handler404
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from rest_framework_simplejwt.authentication import JWTAuthentication





def custom_404_view(request, exception):
    return render(request, '404.html', status=404)

handler404 = custom_404_view


from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

def is_user_logged_in(request):
    """
    إرجاع True أو False إذا المستخدم مسجّل دخول
    (يجدد access token أولاً إذا انتهى ثم يتحقق)
    """
    access_token = request.COOKIES.get("access_token")
    refresh_token = request.COOKIES.get("refresh_token")

    if not access_token or not refresh_token:
        return False

    try:
        # تحقق من صلاحية access token
        jwt.decode(access_token, settings.SECRET_KEY, algorithms=["HS256"])
    except ExpiredSignatureError:
        # إذا انتهت صلاحية access token، نحاول إنشاء واحد جديد من refresh
        try:
            refresh = RefreshToken(refresh_token)
            new_access = str(refresh.access_token)

            # تحديث الكوكيز فورًا
            request.new_access_token = new_access
            access_token = new_access
        except TokenError:
            return False
    except InvalidTokenError:
        return False

    # الآن نتحقق من المستخدم باستخدام التوكن (الجديد أو القديم)
    try:
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(access_token)
        user = jwt_auth.get_user(validated_token)
        return user.is_authenticated
    except Exception:
        return False


def Base(request):
    user_authenticated = is_user_logged_in(request)

    logo = StoreSettings.objects.first()
    categories = Category.objects.all()
    categories_show_5 = Category.objects.all().order_by('-id')[:5]
    more_all_categories = Category.objects.all().order_by('-id')[5:]
    currency = settings.CURRENCY_SYMBOL

    context = {
        'logo': logo,
        'categories': categories,
        'categories_': categories_show_5,
        'more_all_categories': more_all_categories,
        'currency': currency,
        'user_authenticated': user_authenticated,
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




def Product_Details(request, pk):
    product = get_object_or_404(Product, id=pk)
    
    similar_products = Product.objects.filter(
        categories__in=product.categories.all()
    ).exclude(id=product.id).distinct()[:8]
    
    for p in similar_products:
        rating_info = p.ratings.aggregate(avg_rating=Avg('rating'), count=Count('id'))
        avg = rating_info['avg_rating'] or 0
        p.avg_rating = avg
        p.review_count = rating_info['count'] or 0
        
        # حساب النجوم الكاملة والنصفية والفارغة
        full_stars = floor(avg)  # نجوم كاملة
        half_star = 1 if (avg - full_stars) >= 0.5 else 0  # نصف نجمة إذا >=0.5
        empty_stars = 5 - full_stars - half_star  # باقي النجوم فارغة
        p.full_stars = range(full_stars)
        p.half_star = half_star
        p.empty_stars = range(empty_stars)

    base_context = Base(request)
    context = {"similar_products": similar_products}
    context.update(base_context)
    return render(request, 'product-details.html', context)


# Shop
def Shop(request):
    base_context = Base(request)  # جلب logo
    categorys = Category.objects.all()
    options = Option.objects.all()
    color = Color.objects.all()
    size = Size.objects.all()
    context = {
        "category": categorys,
        "options": options,
        "colors": color,
        "sizes": size,
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


# @login_required(login_url='login_page')
def profile(request):
    base_context = Base(request)
    context = {
        
    }
    context.update(base_context)

    return render(request, 'profile.html', context)



def cart(request):
    tax = Tax.objects.filter(active=True).last()
    discount = Discount.objects.filter(active=True).last()
    shippingFee = ShippingFee.objects.filter(active=True).last()
    serviceFee = ServiceFee.objects.filter(active=True).last()
    
    base_context = Base(request)  # جلب logo وبيانات أساسية
    
    context = {
        "tax": tax,
        "discount": discount,
        "shippingFee": shippingFee,
        "serviceFee": serviceFee,
    }
    
    context.update(base_context)
    return render(request, 'cart.html', context)




def checkout(request):
    tax = Tax.objects.filter(active=True).last()
    discount = Discount.objects.filter(active=True).last()
    shippingFee = ShippingFee.objects.filter(active=True).last()
    serviceFee = ServiceFee.objects.filter(active=True).last()
    
    base_context = Base(request)  # جلب logo وبيانات أساسية
    
    context = {
        "tax": tax,
        "discount": discount,
        "shippingFee": shippingFee,
        "serviceFee": serviceFee,
    }
    
    context.update(base_context)
    return render(request,'checkout.html',context)


def confirmation(request, id):
    base_context = Base(request)  # جلب logo

    order = get_object_or_404(Order, id=id)
    
    # احسب المجاميع
    subtotal = sum(float(item.price) * getattr(item, 'quantity', 1) for item in order.products.all())
    
    shippingFee = ShippingFee.objects.filter(active=True).last()
    serviceFee = ServiceFee.objects.filter(active=True).last()
    tax_rate = 0.08  # مثال: 8%
    discount_amount = getattr(order, 'discount_amount', 0)  # أو مثال ثابت

    shipping = float(shippingFee.cost) if shippingFee else 0
    service = float(serviceFee.cost) if serviceFee else 0
    tax = subtotal * tax_rate
    total = subtotal + shipping + service + tax - discount_amount

    context = {
        'order': order,
        'subtotal': subtotal,
        'shipping': shipping,
        'service': service,
        'tax': tax,
        'discount': discount_amount,
        'total': total,
        "shippingFee": shippingFee,
        "serviceFee": serviceFee,
    }
    context.update(base_context)
    return render(request, 'confirmation.html', context)



def about(request):
    base_context = Base(request)  # جلب logo
    context = {
    }
    context.update(base_context) 
    return render(request,'about.html',context)

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
