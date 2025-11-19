from django.urls import path
from .views import PublicOfertasView, MinhasOfertasView

urlpatterns = [
    path('ofertas/', PublicOfertasView.as_view()),
    path('minhas-ofertas/', MinhasOfertasView.as_view()),
]