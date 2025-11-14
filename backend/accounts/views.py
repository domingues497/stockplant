from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth.models import User
from .serializers import MeSerializer, AdminUserCreateSerializer, AdminUserUpdateSerializer
from .permissions import IsAdminRole

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = MeSerializer.from_user(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AdminUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created = serializer.save()
        return Response(created, status=status.HTTP_201_CREATED)

    def get(self, request):
        role_filter = request.GET.get('role')
        users = User.objects.all().order_by('username')
        data = []
        for u in users:
            role = getattr(getattr(u, 'role', None), 'role', None) or ''
            if role_filter and role != role_filter:
                continue
            data.append({"id": u.id, "username": u.username, "email": u.email, "role": role, "is_active": u.is_active})
        return Response(data, status=status.HTTP_200_OK)

class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, user_id: int):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminUserUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = serializer.update(user, serializer.validated_data)
        return Response(updated, status=status.HTTP_200_OK)
