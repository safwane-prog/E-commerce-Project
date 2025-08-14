from django.contrib import admin
from .models import *
# Register your models here.

admin.site.register(Cart)
admin.site.register(Order)
admin.site.register(CartItem)
admin.site.register(SupplierInquiry)
admin.site.register(wishlist)
admin.site.register(wishlistItem)
admin.site.register(Coupon)
admin.site.register(CouponUsage)


@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ("name", "amount", "percent", "active")
    list_filter = ("active",)
    search_fields = ("name",)


@admin.register(Tax)
class TaxAdmin(admin.ModelAdmin):
    list_display = ("name", "rate", "active")
    list_filter = ("active",)
    search_fields = ("name",)


@admin.register(ShippingFee)
class ShippingFeeAdmin(admin.ModelAdmin):
    list_display = ("region", "cost", "estimated_days", "active")
    list_filter = ("active",)
    search_fields = ("region",)


@admin.register(ServiceFee)
class ServiceFeeAdmin(admin.ModelAdmin):
    list_display = ("name", "cost", "active")
    list_filter = ("active",)
    search_fields = ("name",)