from django.contrib import admin
from .models import *
# Register your models here.

admin.site.register(Cart)
admin.site.register(Order)
admin.site.register(CartItem)
admin.site.register(SupplierInquiry)
admin.site.register(wishlist)
admin.site.register(wishlistItem)