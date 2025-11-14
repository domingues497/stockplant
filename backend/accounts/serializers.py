from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserRole

class MeSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)
    role = serializers.CharField(allow_blank=True)

    @staticmethod
    def from_user(user: User):
        role = None
        try:
            role = user.role.role
        except Exception:
            role = None
        return MeSerializer({
            "id": user.id,
            "username": user.username,
            "email": user.email or "",
            "role": role or "",
        })

class AdminUserCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=("PRODUTOR","CLIENTE"))

    def create(self, validated_data):
        username = validated_data["username"]
        email = validated_data.get("email", "")
        password = validated_data["password"]
        role = validated_data["role"]

        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError("Username já existe")
        user = User(username=username, email=email)
        user.set_password(password)
        user.save()
        UserRole.objects.update_or_create(user=user, defaults={"role": role})
        return {"id": user.id, "username": user.username, "email": user.email, "role": role}

class AdminUserUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=("PRODUTOR","CLIENTE"), required=False)
    is_active = serializers.BooleanField(required=False)
    password = serializers.CharField(write_only=True, required=False)

    def update(self, instance, validated_data):
        role = validated_data.get("role")
        is_active = validated_data.get("is_active")
        if role is not None:
            UserRole.objects.update_or_create(user=instance, defaults={"role": role})
        if is_active is not None:
            instance.is_active = bool(is_active)
            instance.save(update_fields=["is_active"])
        password = validated_data.get("password")
        if password:
            instance.set_password(password)
            instance.save(update_fields=["password"])
        current_role = getattr(getattr(instance, 'role', None), 'role', None) or ''
        return {"id": instance.id, "username": instance.username, "email": instance.email, "role": current_role, "is_active": instance.is_active}
