from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from .models import *
from .serializers import *


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
            product=product,
        )

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