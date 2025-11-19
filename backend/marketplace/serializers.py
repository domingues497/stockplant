from rest_framework import serializers
from .models import Oferta
from farm.models import CulturaInfo


class OfertaSerializer(serializers.ModelSerializer):
    imagem_url = serializers.SerializerMethodField()
    class Meta:
        model = Oferta
        fields = [
            'id','cultivo_id','cultura','variedade','origem','preco_kg','quantidade_kg','ativo','criado_em','imagem_url'
        ]

    def get_imagem_url(self, obj: Oferta):
        try:
            ci = CulturaInfo.objects.filter(nome__iexact=obj.cultura).first()
            return ci.imagem_url if ci and ci.imagem_url else ''
        except Exception:
            return ''