from datetime import datetime
from mongoengine import Document, StringField, ReferenceField, DateTimeField
from src.models.project_model import Project

class Phase(Document):
    name = StringField(required=True)
    project = ReferenceField(Project, required=True)
    deadline = DateTimeField(required=False)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)   # ✅ added

    # ✅ lifecycle status
    status = StringField(default="active", choices=["active", "completed"])

    meta = {"collection": "phases"}

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super(Phase, self).save(*args, **kwargs)

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "project": str(self.project.id) if self.project else None,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "status": self.status,
        }
