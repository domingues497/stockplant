from django.db import models


class Oferta(models.Model):
    cultura = models.CharField(max_length=100)
    variedade = models.CharField(max_length=100, blank=True)
    origem = models.CharField(max_length=255, blank=True)
    preco_kg = models.DecimalField(max_digits=10, decimal_places=2)
    quantidade_kg = models.DecimalField(max_digits=14, decimal_places=2)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em", "-id"]

    def __str__(self):
        return f"{self.cultura} {self.variedade} {self.quantidade_kg}kg"
