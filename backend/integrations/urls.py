from django.urls import path
from .views import SigmaABCLogarView

urlpatterns = [
    path('sigmaabc/logar/', SigmaABCLogarView.as_view()),
]