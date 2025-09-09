from datetime import datetime
from mongoengine import Document, StringField, ReferenceField, DateTimeField, ListField
from src.models.project_model import Project

class Phase(Document):

    name = StringField(required=True)
    project = ReferenceField(Project, required=True)
    deadline = DateTimeField(required=False)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {"collection": "phases"}

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "project": str(self.project.id) if self.project else None,
            "deadline": self.deadline,
            "created_at": self.created_at,
        }
