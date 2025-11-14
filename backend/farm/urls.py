from rest_framework.routers import DefaultRouter
from .views import FazendaViewSet, CultivoViewSet

router = DefaultRouter()
router.register(r'fazendas', FazendaViewSet, basename='fazenda')
router.register(r'cultivos', CultivoViewSet, basename='cultivo')

urlpatterns = router.urls

