from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    password_reset_code = models.CharField(max_length=6, null=True, blank=True)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'  # هنا التغيير المهم
    REQUIRED_FIELDS = ['username']  # الحقول المطلوبة عند إنشاء مستخدم جديد
