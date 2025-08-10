from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from .models import Product
from .serializers import ProductSerializer

class ProductListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)


