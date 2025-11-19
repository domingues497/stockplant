from rest_framework.permissions import BasePermission

class IsProdutor(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        role = getattr(getattr(user, 'role', None), 'role', None)
        return role == 'PRODUTOR' or user.is_superuser

class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in ('GET','HEAD','OPTIONS'):
            return True
        return getattr(obj, 'produtor', None) == request.user

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        try:
            role = getattr(getattr(user, 'role', None), 'role', None)
        except Exception:
            role = None
        return user.is_superuser or role == 'ADMIN'

