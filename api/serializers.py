from rest_framework import serializers
from .models import Note, Category, Tag

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class NoteSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False
    )
    tags_data = TagSerializer(source='tags', many=True, read_only=True)

    class Meta:
        model = Note
        fields = '__all__'

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        note = Note.objects.create(**validated_data)
        for tag_name in tags_data:
            Tag.objects.create(note=note, name=tag_name)
        return note

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tags_data is not None:
            instance.tags.all().delete()
            for tag_name in tags_data:
                Tag.objects.create(note=instance, name=tag_name)
                
        return instance
