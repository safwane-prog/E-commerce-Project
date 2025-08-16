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

    def get_queryset(self):
        return Product.objects.annotate(avg_rating=Avg('ratings__rating')).all()

class BestsellerProductListAPIView(generics.ListAPIView):
    queryset = Product.objects.all().order_by('-sales_count')
    serializer_class = ProductShopSerializer
    permission_classes = [AllowAny]
    pagination_class = ProductPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProductFilter
    
    def get_queryset(self):
        return Product.objects.annotate(avg_rating=Avg('ratings__rating')).all()


class ProductDetail(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        product = get_object_or_404(Product, id=pk)
        serializer = ProductDetileserializers(product)

        # إحصائيات التقييم
        ratings_stats = product.ratings.values('rating').annotate(count=Count('rating'))
        ratings_dict = {i: 0 for i in range(1, 6)}  # تهيئة الأرقام من 1 إلى 5
        for stat in ratings_stats:
            ratings_dict[stat['rating']] = stat['count']

        total_reviews = sum(ratings_dict.values())
        avg_rating = product.ratings.aggregate(avg=Avg('rating'))['avg'] or 0

        # إضافة النتائج للـ serializer data
        data = serializer.data
        data['ratings_breakdown'] = ratings_dict
        data['total_reviews'] = total_reviews
        data['average_rating'] = round(avg_rating, 2)

        return Response(data)


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
    permission_classes = [AllowAny]  # يمكن تغييره إلى IsAuthenticated

    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        product_id = request.data.get('product')
        
        if not product_id:
            return Response({"error": "Product ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # التحقق إذا كان المستخدم قام بالتقييم مسبقًا
        if user:
            existing_rating = Rating.objects.filter(user=user, product_id=product_id).first()
            if existing_rating:
                return Response({"error": "You have already rated this product"}, status=status.HTTP_403_FORBIDDEN)
        
        # يمكن أيضًا منع تقييم نفس البريد (email) أكثر من مرة إذا كان المستخدم غير مسجل
        email = request.data.get('email')
        if email and Rating.objects.filter(email=email, product_id=product_id).exists():
            return Response({"error": "This email has already rated this product"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = RatingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
