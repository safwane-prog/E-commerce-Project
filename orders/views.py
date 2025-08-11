from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from .models import *
from .serializers import *
from rest_framework.permissions import AllowAny,IsAdminUser,IsAuthenticated
from django.shortcuts import get_object_or_404

class Add_To_Cart(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        cart, created = Cart.objects.get_or_create(user=user)

        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"message": "Product ID is required"}, status=400)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"message": "Product not found"}, status=404)

        existing_item = CartItem.objects.filter(cart=cart, product=product).first()
        if existing_item:
            # بدل 400، نرجع 200 مع رسالة مناسبة
            return Response({"message": "Product already in cart"}, status=200)

        CartItem.objects.create(
            cart=cart,
            product=product,
            quantity=1
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

        items = CartItem.objects.filter(cart__user=user)
        serializer = CartItemSerializer(items, many=True)
        return Response(serializer.data)

    def delete(self, request, id):
        item = get_object_or_404(CartItem, id=id)
        item.delete()
        return Response({"message": "Item deleted successfully"})

    def put(self, request, id):
        item = get_object_or_404(CartItem, id=id)
        quantity_change = request.data.get("quantity_change")  # example: +1 or -1

        try:
            quantity_change = int(quantity_change)
        except (TypeError, ValueError):
            return Response({"error": "Invalid quantity value"}, status=400)

        item.quantity += quantity_change
        if item.quantity <= 0:
            item.delete()
            return Response({"message": "Item removed from cart"})
        
        item.save()
        return Response({"message": "Quantity updated", "quantity": item.quantity})




class CreateOrderNoAuthenticated(APIView):
    permission_classes = [AllowAny]

    def post(self, request, id):
        # محاولة الحصول على المنتج
        try:
            product = Product.objects.get(id=id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        # الحصول على البيانات من body الطلب
        quantity = request.data.get("quantity", 1)
        customer_name = request.data.get("customer_name")
        customer_phone = request.data.get("customer_phone")
        customer_address = request.data.get("customer_address")

        # تحقق من وجود البيانات الأساسية
        if not all([customer_name, customer_phone, customer_address]):
            return Response({"error": "Missing required customer information"}, status=status.HTTP_400_BAD_REQUEST)

        # إنشاء عنصر سلة مؤقت (إذا كنت تحتاجه)
        # لو لم يكن لديك user مسجل يمكنك ترك user فارغ أو تعديل موديل CartItem ليقبل user فارغ
        cart_item = CartItem.objects.create(
            product=product,
            quantity=quantity,
        )

        # إنشاء الطلب
        order = Order.objects.create(
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_address=customer_address,
            payment_method=Order.PaymentMethod.CASH_ON_DELIVERY,
            state=Order.OrderState.PENDING,
        )

        # ربط المنتجات مع الطلب (حسب تصميمك)
        order.products.add(product)
        order.save()

        return Response({"message": "Order created successfully", "order_id": str(order.id)}, status=status.HTTP_201_CREATED)
