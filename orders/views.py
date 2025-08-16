from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from .models import *
from .serializers import *
from users.serializers import *
from rest_framework.permissions import AllowAny,IsAdminUser,IsAuthenticated
from django.shortcuts import get_object_or_404
from decimal import Decimal

class Add_To_Cart(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        cart, created = Cart.objects.get_or_create(user=user)

        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"message": "Product ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        # التحقق من وجود المنتج
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"message": "Product not found"}, status=404)

        # قراءة القيم
        quantity = request.data.get('quantity') or 1
        color = request.data.get('color') or None
        size = request.data.get('size') or None
        options = request.data.get('options') or None

        # البحث عن المنتج نفسه
        existing_item = CartItem.objects.filter(
            cart=cart,
            product=product,
            color=color,
            size=size,
            options=options
        ).first()

        if existing_item:
            if existing_item.is_ordered:
                # إذا كان موجود لكن is_ordered=True → رجعه للسلة
                existing_item.is_ordered = False
                existing_item.quantity = quantity  # أو زيادة الكمية إذا حابب
                existing_item.save()
                return Response({"message": "Product restored to cart"}, status=200)
            else:
                return Response({"message": "Product already in cart"}, status=200)

        # إذا غير موجود نهائيًا → أضفه
        CartItem.objects.create(
            cart=cart,
            product=product,
            quantity=quantity,
            color=color,
            size=size,
            options=options
        )

        return Response({"message": "Product added successfully"}, status=201)



class Add_To_Wishlist(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        wishlist_obj, created = wishlist.objects.get_or_create(user=user)

        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"message": "Product ID is required"}, status=400)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"message": "Product not found"}, status=404)

        existing_item = wishlistItem.objects.filter(wishlist=wishlist_obj, product=product).first()
        if existing_item:
            # بدل 400، نرجع 200 مع رسالة مناسبة
            return Response({"message": "Product already in wishlist"}, status=200)

        wishlistItem.objects.create(
            wishlist=wishlist_obj,
            product=product
        )
        return Response({"message": "Product added successfully"}, status=201)
    
    def delete(self, request, product_id=None):
        user = request.user
        wishlist_obj = wishlist.objects.filter(user=user).first()

        if not product_id:
            return Response({"message": "Product ID is required"}, status=400)

        if not wishlist_obj:
            return Response({"message": "Wishlist not found"}, status=404)
    
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"message": "Product not found"}, status=404)

        item = wishlistItem.objects.filter(wishlist=wishlist_obj, product=product).first()
        if not item:
            return Response({"message": "Product not in wishlist"}, status=404)

        item.delete()
        return Response({"message": "Product removed from wishlist"}, status=200)
    

class SupplierinquiryView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = SupplierinquirySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'status': 'success',
                    'message': 'Supplier inquiry submitted successfully',
                    'data': serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(
            {
                'status': 'error',
                'message': 'Invalid data',
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    


class CartItemsViewsBuyUser(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id=None):
        user = request.user
        if not user.is_authenticated:
            return Response({"error": "User undefined"}, status=401)

        items = CartItem.objects.filter(cart__user=user, is_ordered=False)

        # Serializer للـ items
        serializer = CartItemSerializer(items, many=True)

        # حساب subtotal (مجموع أسعار كل المنتجات مع الكمية)
        subtotal = sum([item.product.price * item.quantity for item in items], Decimal('0.00'))

        # جلب الخصائص الإضافية
        tax = Tax.objects.filter(active=True).last()
        discount = Discount.objects.filter(active=True).last()
        shippingFee = ShippingFee.objects.filter(active=True).last()
        serviceFee = ServiceFee.objects.filter(active=True).last()

        # تطبيق الخصم
        discount_amount = Decimal('0.00')
        if discount:
            if getattr(discount, 'percent', None):
                discount_amount = subtotal * (Decimal(discount.percent) / Decimal('100'))
            elif getattr(discount, 'amount', None):
                discount_amount = Decimal(discount.amount)

        total = subtotal - discount_amount
        # إضافة الضريبة
        if tax and getattr(tax, 'rate', None):
            total += total * (Decimal(tax.rate) / Decimal('100'))

        # إضافة رسوم الشحن
        if shippingFee and getattr(shippingFee, 'cost', None):
            total += Decimal(shippingFee.cost)

        # إضافة رسوم الخدمة
        if serviceFee and getattr(serviceFee, 'cost', None):
            total += Decimal(serviceFee.cost)

        total = round(total + tax.rate, 2)

        return Response({
            "items": serializer.data,
            "subtotal": float(subtotal),
            "discount": float(discount_amount),
            "tax": float(tax.rate) if tax else None,
            "shippingFee": float(shippingFee.cost) if shippingFee else None,
            "serviceFee": float(serviceFee.cost) if serviceFee else None,
            "total": float(total),
        })


    def delete(self, request, id):
        item = get_object_or_404(CartItem, id=id)
        item.delete()
        return Response({"message": "Item deleted successfully"})

    def put(self, request, id):
        item = get_object_or_404(CartItem, id=id)
        quantity_change = request.data.get("quantity_change")

        try:
            quantity_change = int(quantity_change)
        except (TypeError, ValueError):
            return Response({"error": "Invalid quantity value"}, status=400)

        item.quantity += quantity_change
        if item.quantity <= 0:
            item.delete()
            return Response({"message": "Item removed from cart"})

        item.save()

        # حساب total الخاص بالمنتج
        item_total = float(item.product.price * item.quantity)

        return Response({
            "message": "Quantity updated",
            "quantity": item.quantity,
            "total": item_total
        })

class CreateOrderNoAuthenticated(APIView):
    permission_classes = [AllowAny]

    def post(self, request, id):
        try:
            product = Product.objects.get(id=id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        quantity = int(request.data.get("quantity", 1))
        customer_name = request.data.get("customer_name")
        customer_phone = request.data.get("customer_phone")
        customer_address = request.data.get("customer_address")

        if not all([customer_name, customer_phone, customer_address]):
            return Response({"error": "Missing required customer information"}, status=status.HTTP_400_BAD_REQUEST)

        # إنشاء الطلب
        order = Order.objects.create(
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_address=customer_address,
            payment_method=Order.PaymentMethod.CASH_ON_DELIVERY,
            state=Order.OrderState.PENDING,
        )
        order.products.add(product)
        order.save()

        # زيادة sales_count للمنتج
        product.sales_count += quantity
        product.save(update_fields=['sales_count'])

        return Response({"message": "Order created successfully", "order_id": str(order.id)}, status=status.HTTP_201_CREATED)



class CreateOrder(APIView):
    permission_classes = [IsAuthenticated]

    def calculate_totals(self, items):
        subtotal = Decimal('0.00')
        for item in items:
            subtotal += Decimal(item.product.price) * item.quantity

        # جلب الخصائص الإضافية
        tax = Tax.objects.filter(active=True).last()
        discount_obj = Discount.objects.filter(active=True).last()
        shippingFee = ShippingFee.objects.filter(active=True).last()
        serviceFee = ServiceFee.objects.filter(active=True).last()

        # حساب الخصم
        discount = Decimal('0.00')
        if discount_obj:
            if getattr(discount_obj, 'percent', None):
                discount = subtotal * (Decimal(discount_obj.percent) / Decimal('100'))
            elif getattr(discount_obj, 'amount', None):
                discount = Decimal(discount_obj.amount)

        total = subtotal - discount

        # إضافة الضريبة
        tax_rate = Decimal(tax.rate) if tax and getattr(tax, 'rate', None) else Decimal('0.00')
        total += total * (tax_rate / Decimal('100'))

        # رسوم الشحن
        shipping = Decimal(shippingFee.cost) if shippingFee and getattr(shippingFee, 'cost', None) else Decimal('0.00')
        total += shipping

        # رسوم الخدمة
        service_fee = Decimal(serviceFee.cost) if serviceFee and getattr(serviceFee, 'cost', None) else Decimal('0.00')
        total += service_fee

        total = round(total, 2) + tax.rate
        return float(subtotal), float(discount), float(tax_rate), float(shipping), float(service_fee), float(total)

    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({"error": "User undefined"}, status=401)

        items = CartItem.objects.filter(cart__user=user, is_ordered=False)
        if not items.exists():
            return Response({
                "order_summary": [],
                "subtotal": 0,
                "discount": 0,
                "tax": 0,
                "shipping": 0,
                "service_fee": 0,
                "total": 0
            }, status=200)

        order_summary = []
        for item in items:
            order_summary.append({
                "id": str(item.id),
                "quantity": item.quantity,
                "product": {
                    "id": str(item.product.id),
                    "name": item.product.name,
                    "price": float(item.product.price),
                    "image_1": item.product.image_1.url if item.product.image_1 else None
                }
            })

        subtotal, discount, tax_rate, shipping, service_fee, total = self.calculate_totals(items)
    
        return Response({
            "order_summary": order_summary,
            "subtotal": subtotal,
            "discount": discount,
            "tax": tax_rate,
            "shipping": shipping,
            "service_fee": service_fee,
            "total": total
        }, status=200)

    def post(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({"error": "User undefined"}, status=401)

        customer_name = request.data.get("customer_name")
        customer_email = request.data.get("customer_email")
        customer_phone = request.data.get("customer_phone")
        customer_address = request.data.get("customer_address")
        is_use_coupon = request.data.get("is_use_coupon")
        code_id = request.data.get("code_id")
        total_ = request.data.get("total")
        city = request.data.get("city")

        if not all([customer_name, customer_phone, customer_address, city]):
            return Response({"error": "Missing required customer information"}, status=400)

        items = CartItem.objects.filter(cart__user=user, is_ordered=False)
        if not items.exists():
            return Response({"error": "Cart is empty"}, status=400)

        # تسجيل استخدام الكوبون مرة واحدة لكل مستخدم
        if code_id and not CouponUsage.objects.filter(user=user, coupon_id=code_id).exists():
            CouponUsage.objects.create(user=user, coupon_id=code_id)

        order = Order.objects.create(
            state=Order.OrderState.PENDING,
            payment_method=Order.PaymentMethod.CASH_ON_DELIVERY,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            customer_address=customer_address,
            city=city,
            user=user,
            total=total_,
            is_use_coupon=is_use_coupon
        )

        for item in items:
            order.products.add(item.product)
            item.is_ordered = True
            item.order = order
            item.save()

            # زيادة sales_count حسب كمية المنتج
            item.product.sales_count += item.quantity
            item.product.save(update_fields=['sales_count'])

        subtotal, discount, tax_rate, shipping, service_fee, total = self.calculate_totals(items)
        order.save()

        order_summary = [{
            "id": str(item.id),
            "quantity": item.quantity,
            "product": {
                "id": str(item.product.id),
                "name": item.product.name,
                "price": float(item.product.price),
                "image_1": item.product.image_1.url if item.product.image_1 else None
            }
        } for item in items]

        return Response({
            "message": "Order created successfully",
            "order": {
                "id": str(order.id),
                "customer_name": order.customer_name,
                "customer_email": order.customer_email,
                "customer_phone": order.customer_phone,
                "customer_address": order.customer_address,
                "city": order.city,
                "subtotal": subtotal,
                "discount": discount,
                "tax": tax_rate,
                "shipping": shipping,
                "service_fee": service_fee,
                "total": total,
                "items": order_summary
            }
        }, status=201)


class ApplyCouponAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({"error": "User undefined"}, status=status.HTTP_401_UNAUTHORIZED)
        print(f"User {user.username} is applying a coupon")
        coupon_code = request.data.get("code")
        if not coupon_code:
            return Response({"error": "Coupon code is required"}, status=status.HTTP_400_BAD_REQUEST)
        if CouponUsage.objects.filter(user=user, coupon__code=coupon_code).exists():
            return Response({"error": "Coupon already used by this user"}, status=status.HTTP_400_BAD_REQUEST)

        if not Coupon.objects.filter(code=coupon_code, active=True).exists():
            return Response({"error": "Invalid or inactive coupon code"}, status=status.HTTP_400_BAD_REQUEST)
        code = Coupon.objects.get(code=coupon_code, active=True)
        print(f"Applying coupon: {code.code} with discount {code.discount_percent}%")
        return Response({"message": "Coupon applied successfully","code":code.code,"discount_percent":code.discount_percent,"code_id":code.id}, status=status.HTTP_200_OK)