from rest_framework import serializers
from .models import Oferta


class OfertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Oferta
        fields = [
            'id','cultura','variedade','origem','preco_kg','quantidade_kg','ativo','criado_em'
        ]