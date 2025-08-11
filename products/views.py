from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from .models import Product
from .serializers import *
from .filters import ProductFilter  
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count, Q
from rest_framework import status


class ProductPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

class ProductShop(generics.ListAPIView):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductShopSerializer
    permission_classes = [AllowAny]
    pagination_class = ProductPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProductFilter

class ProductDetail(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        product = get_object_or_404(Product, id=pk)
        serializer = ProductDetileserializers(product)  # بدون many=True
        return Response(serializer.data)


class ProductRatingStatsAndDescription(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        product = get_object_or_404(Product, id=pk)

        ratings = product.ratings.all()
        average_rating = ratings.aggregate(avg=Avg('rating'))['avg'] or 0
        total_ratings = ratings.count()

        # توزيع التقييمات حسب النجوم 1-5
        ratings_count = {}
        for i in range(1, 6):
            ratings_count[str(i)] = ratings.filter(rating=i).count()

        # حساب النسب المئوية لتعبئة الشرائط (bars) في العرض - بالنسبة لكل نجمة
        # تجنب القسمة على صفر:
        ratings_percentage = {}
        for star in ratings_count:
            if total_ratings > 0:
                ratings_percentage[star] = round((ratings_count[star] / total_ratings) * 100, 2)
            else:
                ratings_percentage[star] = 0

        data = {
            "average_rating": round(average_rating, 2),
            "total_ratings": total_ratings,
            "ratings_count": ratings_count,
            "ratings_percentage": ratings_percentage,
            "description": product.description_1  # أو غيرها من الحقول التي تريد عرضها
        }

        return Response(data)



class AddRating(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RatingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)