from django.contrib.auth import get_user_model
from django.db.models.signals import post_migrate
from django.dispatch import receiver

User = get_user_model()

@receiver(post_migrate)
def create_default_admin(sender, **kwargs):
    if sender.name == 'users':  # تأكد أن الإشارة تخص تطبيق users
        # تحقق من وجود superuser بالفعل
        if not User.objects.filter(is_superuser=True).exists():
            User.objects.create_superuser(
                email='admin@example.com',
                username='admin',
                password='Admin1234'
            )
            print("Superuser created: admin@example.com")
        else:
            print("Superuser already exists. Skipping creation.")
    

