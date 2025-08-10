from django.shortcuts import render
from products.models import Product
from django.conf import settings
from .models import StoreHeroImage,StoreSettings
from products.models import Category

def Base(request):
    logo = StoreSettings.objects.first()
    categorys = Category.objects.all()
    context = {
        'logo':logo,
        'categorys':categorys,
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

    base_context = Base(request)  # جلب logo

    context = {
        
    }
    context.update(base_context)  # دمج logo مع بقية البيانات
    return render(request,'product-details.html',context)

# Shop
def Shop(request):
    
    base_context = Base(request)  # جلب logo

    context = {
        
    }
    context.update(base_context)  # دمج logo مع بقية البيانات
    return render(request,'shop.html')

# contact
def Contact(request):
    
    base_context = Base(request)  # جلب logo

    context = {
        
    }
    context.update(base_context)  # دمج logo مع بقية البيانات
    return render(request,'contact.html')


def Login(request):
    return render(request,'login.html')



def Profile(request):
    return render(request,'profile.html')