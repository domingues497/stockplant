from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0001_initial'),
        ('farm', '0007_cultivar_cultura_info'),
    ]

    operations = [
        migrations.AddField(
            model_name='oferta',
            name='cultivo',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='ofertas', to='farm.cultivo'),
        ),
    ]