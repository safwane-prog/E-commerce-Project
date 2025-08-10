from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    username = models.CharField(unique=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']
