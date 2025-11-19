from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from decimal import Decimal
from farm.permissions import IsProdutor
from django.db.models import Q
from farm.models import Cultivo
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

    def get_permissions(self):
        if getattr(self.request, 'method', 'GET') == 'POST':
            return [IsAuthenticated(), IsProdutor()]
        return [AllowAny()]

    def post(self, request):
        try:
            cultivo_id_raw = request.data.get('cultivo_id')
            cultivo = None
            if cultivo_id_raw is not None:
                try:
                    cultivo_id = int(cultivo_id_raw)
                    cultivo = Cultivo.objects.select_related('fazenda').filter(pk=cultivo_id, fazenda__produtor=request.user).first()
                except Exception:
                    cultivo = None
            cultura = (request.data.get('cultura') or '').strip()
            variedade = (request.data.get('variedade') or '').strip()
            origem = (request.data.get('origem') or '').strip()
            preco_kg = Decimal(str(request.data.get('preco_kg')))
            quantidade_kg = Decimal(str(request.data.get('quantidade_kg')))
        except Exception:
            return Response({'detail': 'Parâmetros inválidos'}, status=status.HTTP_400_BAD_REQUEST)

        if cultivo is not None:
            cultura = cultivo.cultura or cultura
            variedade = cultivo.variedade or variedade

        if not cultura:
            return Response({'detail': 'Cultura é obrigatória'}, status=status.HTTP_400_BAD_REQUEST)
        if preco_kg <= 0 or quantidade_kg <= 0:
            return Response({'detail': 'Preço e quantidade devem ser positivos'}, status=status.HTTP_400_BAD_REQUEST)

        oferta = Oferta.objects.create(
            cultivo=cultivo,
            cultura=cultura,
            variedade=variedade,
            origem=origem,
            preco_kg=preco_kg,
            quantidade_kg=quantidade_kg,
            ativo=True,
        )
        data = OfertaSerializer(oferta).data
        return Response(data, status=status.HTTP_201_CREATED)
