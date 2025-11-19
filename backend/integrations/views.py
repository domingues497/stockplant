import os
import time
import jwt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from farm.permissions import IsProdutor


class SigmaABCLogarView(APIView):
    permission_classes = [IsAuthenticated, IsProdutor]

    def get(self, request):
        try:
            identificador = int(request.query_params.get('identificador') or 10988)
            categoria = int(request.query_params.get('categoria') or 1)
        except Exception:
            return Response({'detail': 'Parâmetros inválidos'}, status=status.HTTP_400_BAD_REQUEST)

        secret = os.getenv('SIGMAABC_SECRET')
        if not secret:
            return Response({'detail': 'SIGMAABC_SECRET não configurado'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        now = int(time.time())
        exp_seconds = int(request.query_params.get('exp') or 3600)
        payload = {
            'identificador': identificador,
            'categoria': categoria,
            'iat': now,
            'exp': now + exp_seconds,
        }

        try:
            token = jwt.encode(payload, secret, algorithm='HS256')
        except Exception as e:
            return Response({'detail': f'Erro ao assinar token: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        url = f"https://api.fundacaoabc.org/sigmaabc/web/logar?token={token}"
        return Response({'url': url, 'payload': payload}, status=status.HTTP_200_OK)
