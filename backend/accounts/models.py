from django.db import models
from django.contrib.auth.models import User

class UserRole(models.Model):
    ROLE_CHOICES = (
        ("ADMIN", "ADMIN"),
        ("PRODUTOR", "PRODUTOR"),
        ("CLIENTE", "CLIENTE"),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="role")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

