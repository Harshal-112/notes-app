from rest_framework import viewsets
from .models import Note, Category
from .serializers import NoteSerializer, CategorySerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all().order_by('-updated_at')
    serializer_class = NoteSerializer
