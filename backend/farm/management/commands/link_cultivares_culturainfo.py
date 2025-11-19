from django.core.management.base import BaseCommand
from farm.models import Cultivar, CulturaInfo


class Command(BaseCommand):
    help = 'Vincula Cultivar.cultura_info a CulturaInfo pelo nome (case-insensitive) e sincroniza campo cultura.'

    def handle(self, *args, **kwargs):
        total = 0
        linked = 0
        created_infos = 0
        for cv in Cultivar.objects.all():
            total += 1
            nome = (cv.cultura or '').strip()
            if not nome:
                continue
            info = CulturaInfo.objects.filter(nome__iexact=nome).first()
            if info is None:
                info = CulturaInfo.objects.create(nome=nome)
                created_infos += 1
            if cv.cultura_info_id != info.id:
                cv.cultura_info = info
            # sincroniza texto para padronizar com CulturaInfo
            if cv.cultura != info.nome:
                cv.cultura = info.nome
            cv.save()
            linked += 1
        self.stdout.write(self.style.SUCCESS(f'Total cultivares: {total}'))
        self.stdout.write(self.style.SUCCESS(f'Vinculados/atualizados: {linked}'))
        self.stdout.write(self.style.SUCCESS(f'CulturaInfo criados: {created_infos}'))