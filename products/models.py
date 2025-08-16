from django.db import models
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
from django.db import models
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile

class Category(models.Model):
    name = models.CharField(max_length=200)
    image = models.ImageField(upload_to='category/')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"

    def save(self, *args, **kwargs):
        if self.image:
            # افتح الصورة
            img = Image.open(self.image)

            # حوّلها إلى RGB إذا كانت بصيغة أخرى (مثلاً PNG فيها شفافية)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            # تصغير حجم الصورة (هنا أقصى عرض/ارتفاع = 800px)
            img.thumbnail((800, 800), Image.Resampling.LANCZOS)

            # ضغط الصورة وجودة 70%
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=70)
            buffer.seek(0)

            # حفظ الصورة المصغرة في نفس الحقل
            self.image.save(self.image.name, ContentFile(buffer.read()), save=False)

        super().save(*args, **kwargs)



class Option(models.Model):
    name = models.CharField(max_length=200)
    
    def __str__(self):
        return self.name

class Color(models.Model):
    code = models.CharField(max_length=10)  # مثال: #FF5733
    name = models.CharField(max_length=200)
    
    def __str__(self):
        return self.name
    

class Size(models.Model):
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

    categories = models.ManyToManyField('Category', related_name='products', blank=True)
    options = models.ManyToManyField('Option', related_name='products', blank=True)
    color = models.ManyToManyField('Color', related_name='products', blank=True)
    size = models.ManyToManyField('Size', related_name='products', blank=True)

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

    def compress_image(self, image_field):
        if not image_field:
            return None
        
        img = Image.open(image_field)
        img = img.convert('RGB')  # للتأكد من نوع الصورة

        # تحديد الحد الأقصى للعرض (مثلاً 800 بكسل)
        max_width = 800
        if img.width > max_width:
            ratio = max_width / float(img.width)
            new_height = int(float(img.height) * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

        # حفظ الصورة المضغوطة في ذاكرة مؤقتة
        img_io = BytesIO()
        img.save(img_io, format='JPEG', quality=70)  # الجودة 70% لضغط جيد دون فقد كبير
        img_content = ContentFile(img_io.getvalue(), name=image_field.name)

        return img_content

    def save(self, *args, **kwargs):
        # ضغط الصور قبل الحفظ
        for field_name in ['image_1', 'image_2', 'image_3', 'image_4', 'image_5', 'image_6', 'image_7', 'image_8', 'image_9', 'image_10']:
            image = getattr(self, field_name)
            if image and hasattr(image, 'file'):
                compressed_image = self.compress_image(image)
                if compressed_image:
                    setattr(self, field_name, compressed_image)

        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']


class Rating(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='Rating', null=True, blank=True)

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
