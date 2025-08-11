from django.contrib import admin
from .models import *
# Register your models here.

admin.site.register(Product)
admin.site.register(Category)
admin.site.register(Option)
admin.site.register(Rating)
admin.site.register(Size)
admin.site.register(Color)