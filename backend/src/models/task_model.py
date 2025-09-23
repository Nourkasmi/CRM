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
        # Safe dereference for created_by
        created_by_data = None
        try:
            if self.created_by:
                created_by_data = {
                    "id": str(self.created_by.id),
                    "email": getattr(self.created_by, "email", None)
                }
        except Exception:
            created_by_data = None

        # Safe dereference for assigned_to
        assigned_list = []
        for u in self.assigned_to:
            try:
                assigned_list.append({
                    "id": str(u.id),
                    "email": getattr(u, "email", None)
                })
            except Exception:
                continue

        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "phase": str(self.phase.id) if self.phase else None,
            "project": str(self.phase.project.id) if self.phase and self.phase.project else None,
            "created_by": created_by_data,
            "assigned_to": assigned_list,
            "status": self.status,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
