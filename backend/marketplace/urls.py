from django.urls import path
from .views import PublicOfertasView

urlpatterns = [
    path('ofertas/', PublicOfertasView.as_view()),
]