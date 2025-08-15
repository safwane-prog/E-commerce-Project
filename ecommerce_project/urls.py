from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('admin/', admin.site.urls),

    re_path(r'^auth/', include('djoser.urls')),        # للمسارات الأساسية
    re_path(r'^auth/', include('djoser.urls.jwt')),    # إذا كنت تستخدم JWT

    #  Apps 
    path('', include('website.urls')),
    path('products/', include('products.urls')),
    path('orders/', include('orders.urls')),
    path('users/', include('users.urls')),
    path('dashboard/', include('users.urls')),
    
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)