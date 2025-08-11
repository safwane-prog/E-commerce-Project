# products/context_processors.py
from django.conf import settings
from .models import StoreSettings

def base_vars(request):


    return {
        'main_domin': settings.MINE_DOMINE,
        'currency': settings.CURRENCY_SYMBOL,
        'countries': settings.MINE_COUNTRIES,
        'option_1': settings.OPTION1,
        'option_2': settings.OPTION2,
        'option_3': settings.OPTION3,
    }

def store_settings(request):
    settings_obj = StoreSettings.objects.first()
    return {
        'store_settings': settings_obj
    }
