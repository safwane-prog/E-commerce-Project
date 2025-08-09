from django.db import models
import uuid
from  products.models import Product
from django.contrib.auth import get_user_model

User = get_user_model()


class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    is_completed = models.BooleanField(default=False)
    # بيانات العميل مثل الاسم، العنوان، الهاتف، البريد، الخ
    customer_name = models.CharField(max_length=200)
    customer_address = models.TextField()
    # المزيد من الحقول حسب الحاجة

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)  # سعر المنتج وقت الطلب


class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)



class SupplierInquiry(models.Model):
    item = models.CharField(max_length=255)  
    details = models.TextField(blank=True, null=True)  
    quantity = models.PositiveIntegerField()  
    phone = models.CharField(max_length=20)  

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inquiry for {self.item} - Qty: {self.quantity}"