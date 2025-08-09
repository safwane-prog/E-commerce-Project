from django.db import models
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator


class Category(models.Model):
    name = models.CharField(max_length=200)
    image = models.ImageField(upload_to='category/')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"


class Option(models.Model):
    name = models.CharField(max_length=200)
    
    def __str__(self):
        return self.name


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=300)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    old_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount = models.DecimalField(max_digits=4, decimal_places=2, default=0, null=True, blank=True)
    description_1 = models.TextField()
    description_2 = models.TextField(null=True, blank=True)
    description_3 = models.TextField(null=True, blank=True)

    image_1 = models.ImageField(upload_to='products/')
    image_2 = models.ImageField(upload_to='products/', null=True, blank=True)
    image_3 = models.ImageField(upload_to='products/', null=True, blank=True)
    image_4 = models.ImageField(upload_to='products/', null=True, blank=True)
    image_5 = models.ImageField(upload_to='products/', null=True, blank=True)
    image_6 = models.ImageField(upload_to='products/', null=True, blank=True)
    image_7 = models.ImageField(upload_to='products/', null=True, blank=True)
    image_8 = models.ImageField(upload_to='products/', null=True, blank=True)
    image_9 = models.ImageField(upload_to='products/', null=True, blank=True)
    image_10 = models.ImageField(upload_to='products/', null=True, blank=True)

    is_active = models.BooleanField(default=True)
    sales_count = models.PositiveIntegerField(default=0)

    categories = models.ManyToManyField(Category, related_name='products')
    options = models.ManyToManyField(Option, related_name='products')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def average_rating(self):
        ratings = self.ratings.all()
        if ratings.exists():
            return round(sum(r.rating for r in ratings) / ratings.count(), 2)
        return 0

    def total_reviews(self):
        return self.ratings.count()

    class Meta:
        ordering = ['-created_at']


class Rating(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='ratings')
    name = models.CharField(max_length=200)
    email = models.EmailField(null=True, blank=True)
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    review = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.rating}⭐"

    class Meta:
        ordering = ['-created_at']
