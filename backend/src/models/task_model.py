from datetime import datetime
from mongoengine import Document, StringField, ReferenceField, DateTimeField, ListField
from src.models.user_model import User
from src.models.phase_model import Phase

class Task(Document):
    title = StringField(required=True)
    description = StringField()
    phase = ReferenceField(Phase, required=True)
    created_by = ReferenceField(User, required=True)
    assigned_to = ListField(ReferenceField(User))
    status = StringField(default="todo", choices=["todo", "in_progress", "done"])
    deadline = DateTimeField(required=False)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {"collection": "tasks"}

    def to_dict(self):
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "phase": str(self.phase.id) if self.phase else None,
            "project": str(self.phase.project.id) if self.phase and self.phase.project else None,
            "created_by": {
                "id": str(self.created_by.id),
                "email": self.created_by.email
            } if self.created_by else None,
            "assigned_to": [
                {"id": str(u.id), "email": u.email} for u in self.assigned_to
            ],
            "status": self.status,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
