from django.contrib import admin
from .models import *

admin.site.register(StoreSettings)
admin.site.register(StoreHeroImage)
admin.site.register(Contact)
admin.site.register(AdminRepliedForContactMessage)