from django.db import models
import uuid
from  products.models import Product
from django.contrib.auth import get_user_model
from django.conf import settings
User = get_user_model()




class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items', null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    options = models.CharField(max_length=100, null=True, blank=True)
    color = models.CharField(max_length=100, null=True, blank=True)
    size = models.CharField(max_length=100, null=True, blank=True)
    is_ordered = models.BooleanField(default=False)


class Coupon(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    active = models.BooleanField(default=True)
    usage_limit = models.PositiveIntegerField(default=1)  
    used_count = models.PositiveIntegerField(default=0)  
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.code

class CouponUsage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name="usages")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="coupon_usages")
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('coupon', 'user')  
    def __str__(self):
        return f"{self.user.username} used {self.coupon.code}"



class Discount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)  # اسم للتعريف، مثل "خصم موسمي"
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # خصم ثابت
    percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # خصم نسبة مئوية
    active = models.BooleanField(default=True)

    def __str__(self):
        if self.percent > 0:
            return f"{self.name} - {self.percent}%"
        return f"{self.name} - {self.amount} {settings.CURRENCY_SYMBOL}"  # استخدم رمز العملة من الإعدادات
    

class Tax(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)  # مثلاً VAT, TVA, ضريبة القيمة المضافة
    rate = models.DecimalField(max_digits=5, decimal_places=2, help_text="Tax rate in percentage (e.g., 20 for 20%)")
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.rate}%)"


class ShippingFee(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    region = models.CharField(max_length=100)  # المنطقة أو المدينة
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    estimated_days = models.PositiveIntegerField(default=3)  # مدة التوصيل المتوقعة بالأيام
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.region} - {self.cost} درهم"


class ServiceFee(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)  # مثلاً: تغليف هدية، الدفع عند الاستلام
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.cost} درهم"



class Order(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders', null=True, blank=True)
    order_number = models.PositiveIntegerField(unique=True, null=True, blank=True)
    class OrderState(models.TextChoices):
        PENDING = "Pending", "Pending"
        CONFIRMED = "Confirmed", "Confirmed"
        NO_RESPONSE = "No Response", "No Response"
        CANCELLED = "Cancelled", "Cancelled"
        DELIVERED = "Delivered", "Delivered"

    class PaymentMethod(models.TextChoices):
        CASH_ON_DELIVERY = "Cash on Delivery", "Cash on Delivery"
        CREDIT_CARD = "Credit Card", "Credit Card"
        PAYPAL = "PayPal", "PayPal"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    is_completed = models.BooleanField(default=False)

    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    is_use_coupon = models.BooleanField(default=False)

    options = models.CharField(max_length=100,null=True, blank=True)
    color = models.CharField( max_length=100,null=True, blank=True)
    size = models.CharField(max_length=100,null=True, blank=True)

    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField(null=True, blank=True)
    customer_phone = models.CharField(max_length=20)
    
    customer_address = models.TextField()
    city = models.CharField(max_length=100, null=True, blank=True)

    payment_method = models.CharField(
        max_length=50,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH_ON_DELIVERY
    )
    # أنصح بتغيير هذا إلى ManyToManyField(Product) لو حبيت تخزن فقط المنتجات بدون تفاصيل الكمية والسعر
    products = models.ManyToManyField('products.Product', blank=True)

    state = models.CharField(
        max_length=50,
        choices=OrderState.choices,
        default=OrderState.PENDING
    )
    def save(self, *args, **kwargs):
        if not self.order_number:
            last_order = Order.objects.all().order_by('-order_number').first()
            if last_order and last_order.order_number:
                self.order_number = last_order.order_number + 1
            else:
                self.order_number = 1  # بداية الترقيم
        if self.state == self.OrderState.DELIVERED:
            self.is_completed = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.id} - {self.customer_name}"



class SupplierInquiry(models.Model):
    item = models.CharField(max_length=255)  
    details = models.TextField(blank=True, null=True)  
    quantity = models.PositiveIntegerField()  
    phone = models.CharField(max_length=20)  

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inquiry for {self.item} - Qty: {self.quantity}"
    

class wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class wishlistItem(models.Model):
    wishlist = models.ForeignKey(wishlist, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    
    

