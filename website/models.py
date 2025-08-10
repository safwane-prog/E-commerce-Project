from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
import os
import uuid
from django.contrib.auth import get_user_model

User = get_user_model()

def validate_file_extension(value):
    ext = os.path.splitext(value.name)[1].lower()
    valid_extensions = ['.png', '.jpg', '.jpeg', '.svg']
    if ext not in valid_extensions:
        raise ValidationError('Unsupported file extension. Allowed: png, jpg, jpeg, svg.')

class StoreSettings(models.Model):
    logo = models.FileField(upload_to='logos/', validators=[validate_file_extension])
    
    youtube = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    facebook = models.URLField(blank=True, null=True)
    whatsapp = models.CharField( blank=True, null=True)  # رقم هاتف أو رابط واتساب
    address = models.TextField(blank=True, null=True)

    phone = models.CharField(max_length=20, blank=True, null=True)

    working_hours = models.CharField(max_length=100, blank=True, null=True)
    location_map_link = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"StoreSettings (logo: {self.logo.name})"


class StoreHeroImage(models.Model):
    image = models.ImageField(upload_to='hero_images/', verbose_name="صورة السلايدر")
    slide_name = models.CharField(max_length=255, verbose_name="عنوان السلايدر")
    slide_description = models.TextField(verbose_name="وصف السلايدر", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.slide_name




class Profile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)
    avatar = models.ImageField(upload_to="profiles/", blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.username
