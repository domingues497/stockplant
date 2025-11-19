import os
import time
import jwt
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny


class SigmaABCLogarView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            identificador = int(request.query_params.get('identificador') or 10988)
            categoria = int(request.query_params.get('categoria') or 1)
        except Exception:
            return Response({'detail': 'Parâmetros inválidos'}, status=status.HTTP_400_BAD_REQUEST)

        secret = os.getenv('SIGMAABC_SECRET') or getattr(settings, 'SIGMAABC_SECRET', None)
        if not secret:
            return Response({'detail': 'SIGMAABC_SECRET não configurado'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        now = int(time.time())
        exp_seconds = int(request.query_params.get('exp') or 3600)
        payload = {
            'identificador': identificador,
            'categoria': categoria,
            'exp': now + exp_seconds,
        }

        try:
            token = jwt.encode(payload, secret, algorithm='HS256')
        except Exception as e:
            return Response({'detail': f'Erro ao assinar token: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        url = f"https://api.fundacaoabc.org/sigmaabc/web/logar?{token}"
        if str(request.query_params.get('redirect') or '').lower() in ('1','true','yes'):
            return Response(status=status.HTTP_302_FOUND, headers={'Location': url})
        fmt = str(request.query_params.get('format') or '').lower()
        if fmt == 'text':
            return Response(url, status=status.HTTP_200_OK, content_type='text/plain')
        if fmt == 'html':
            html = f"<html><body><a href='{url}' target='_blank'>{url}</a></body></html>"
            return Response(html, status=status.HTTP_200_OK, content_type='text/html')
        return Response({'url': url, 'payload': payload}, status=status.HTTP_200_OK)
