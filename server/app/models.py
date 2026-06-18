from mongoengine import Document, StringField, ListField, DictField, EmailField, DateTimeField, ReferenceField, EmbeddedDocument, EmbeddedDocumentField
from datetime import datetime
import uuid


class User(Document):
    """User model for authentication."""
    id = StringField(primary_key=True, default=lambda: uuid.uuid4().hex)
    name = StringField(required=True)
    email = EmailField(required=True, unique=True)
    password = StringField(required=True)
    refresh_token = StringField(null=True)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'users',
        'indexes': ['email']
    }

    def update_timestamp(self):
        """Update the updated_at timestamp."""
        self.updated_at = datetime.utcnow()
        self.save()


class Message(EmbeddedDocument):
    """Embedded message document for chat history."""
    role = StringField(required=True, choices=['user', 'assistant'])  # 'user' or 'assistant'
    content = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)


class ChatHistory(Document):
    """Chat history for a user-repository pair."""
    id = StringField(primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id = StringField(required=True)
    repository_id = StringField(required=True)
    messages = ListField(EmbeddedDocumentField(Message), default=list)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'chat_histories',
        'indexes': [
            ('user_id', 'repository_id'),  # Unique pair
            'user_id',
            'repository_id'
        ]
    }

    def update_timestamp(self):
        """Update the updated_at timestamp."""
        self.updated_at = datetime.utcnow()
        self.save()


class Repository(Document):
    """Repository model for storing uploaded/imported repos."""
    id = StringField(primary_key=True, default=lambda: uuid.uuid4().hex)
    name = StringField(required=True)
    user_id = StringField(required=True)
    description = StringField(null=True)
    files = ListField(DictField(), default=list)  # Array of file objects: {path, language, lineCount, size, content}
    repo_meta = DictField(default=dict)  # Repository metadata: {owner, repo, branch, stars, description, language, url}
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'repositories',
        'indexes': ['user_id']
    }

    def update_timestamp(self):
        """Update the updated_at timestamp."""
        self.updated_at = datetime.utcnow()
        self.save()
