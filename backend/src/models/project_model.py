from datetime import datetime
from mongoengine import Document, StringField, ReferenceField, DateTimeField, ListField, BooleanField
from src.models.user_model import User

class Project(Document):
    name = StringField(required=True)
    description = StringField()
    deadline = DateTimeField()
    created_by = ReferenceField(User)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    managers = ListField(ReferenceField(User))
    members = ListField(ReferenceField(User))
    is_archived = BooleanField(default=False)

    meta = {"collection": "projects"}

    def to_dict(self):
        from src.models.phase_model import Phase  # 👈 avoid circular import
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "created_by": {
                "id": str(self.created_by.id),
                "email": self.created_by.email
            } if self.created_by else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_archived": self.is_archived,
            "managers": [
                {"id": str(m.id), "email": m.email} for m in self.managers
            ],
            "members": [
                {"id": str(u.id), "email": u.email} for u in self.members
            ],
            # 👇 New field: everyone assigned to this project (managers + members)
            "assigned_to": [
                {"id": str(u.id), "email": u.email}
                for u in (self.managers + self.members)
            ],
            "phases": [p.to_dict() for p in Phase.objects(project=self)]
        }
