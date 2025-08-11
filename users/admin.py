from django.contrib import admin
from .models import CustomUser
from website.models import Profile

admin.site.register(CustomUser)
admin.site.register(Profile)


