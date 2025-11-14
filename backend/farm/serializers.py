from rest_framework import serializers
from .models import Fazenda, Cultivo

class FazendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fazenda
        fields = [
            'id','nome','cep','cidade','estado','areatotal','areacultivada','latitude','longitude','criado_em'
        ]

class CultivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cultivo
        fields = [
            'id','fazenda','cultura','variedade','area_ha','data_plantio','data_prevista_colheita','criado_em'
        ]

