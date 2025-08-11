from django.db import models
import uuid
from  products.models import Product
from django.contrib.auth import get_user_model

User = get_user_model()




class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items',null=True,blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

class Order(models.Model):
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
    
    

