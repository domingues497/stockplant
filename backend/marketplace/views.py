from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db.models import Q
from .models import Oferta
from .serializers import OfertaSerializer


class PublicOfertasView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Oferta.objects.filter(ativo=True)
        cultura = request.query_params.get('cultura')
        q = request.query_params.get('q')
        ordenar = request.query_params.get('ordenar') or 'preco'
        if cultura:
            qs = qs.filter(cultura__iexact=cultura)
        if q:
            qs = qs.filter(Q(cultura__icontains=q) | Q(variedade__icontains=q) | Q(origem__icontains=q))
        if ordenar == 'quantidade':
            qs = qs.order_by('-quantidade_kg')
        else:
            qs = qs.order_by('preco_kg')
        data = OfertaSerializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)
