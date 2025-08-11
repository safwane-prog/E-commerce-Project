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
        cart, created = Cart.objects.get_or_create(user=user)  # فك الـ tuple

        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"message": "Product ID is required"}, status=400)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"message": "Product not found"}, status=404)

        # إضافة العنصر للسلة
        CartItem.objects.create(
            cart=cart,
            product=product,
            quantity=1
        )

        return Response({"message": "Product added successfully"})
        

class Add_To_Wishlist(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        wishlists, created = wishlist.objects.get_or_create(user=user)
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"message": "Product ID is required"}, status=400)
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"message": "Product not found"}, status=404)
        
        wishlistItem.objects.create(
            wishlist=wishlists,
            product=product
        )
        return Response({"message": "Product added successfully"})

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

