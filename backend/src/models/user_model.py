from datetime import datetime
from mongoengine import Document, StringField, BooleanField, DateTimeField, EmailField

class User(Document):
    """
    User model for MongoEngine
    """
    name = StringField(required=True)
    email = EmailField(required=True, unique=True)
    password = StringField(required=True)
    role = StringField(default="user", choices=["user", "manager", "superuser"])
    is_active = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {"collection": "users"}

    def to_dict(self):
        """Serialize user doc into JSON-safe dict"""
        return {
            "id": str(self.id),
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
