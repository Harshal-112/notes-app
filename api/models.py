from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, default="#6366f1")

    def __str__(self):
        return self.name

class Note(models.Model):
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)
    text_body = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    color = models.CharField(max_length=20, default="default")
    is_pinned = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title if self.title else "Untitled Note"

class Tag(models.Model):
    name = models.CharField(max_length=50)
    note = models.ForeignKey(Note, related_name='tags', on_delete=models.CASCADE)

    def __str__(self):
        return self.name
