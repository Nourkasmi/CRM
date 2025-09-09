from mongoengine import Document, StringField, DateTimeField
from datetime import datetime


class FileType(Document):
    name = StringField(required=True, unique=True)  # e.g., "Contract", "Design Doc"
    description = StringField()
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {"collection": "filetypes"}

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
