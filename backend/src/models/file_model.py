from datetime import datetime
from mongoengine import Document, StringField, ReferenceField, DateTimeField, BooleanField
from src.models.user_model import User
from src.models.project_model import Project
from src.models.filetype_model import FileType

class File(Document):
    filename = StringField(required=True)                # Original filename
    path = StringField(required=True)                    # Local storage path
    uploaded_by = ReferenceField(User, required=True)    # Who uploaded
    project = ReferenceField(Project, required=True)     # Project reference
    filetype = ReferenceField(FileType, required=True)   # Mandatory category
    uploaded_at = DateTimeField(default=datetime.utcnow)
    is_archived = BooleanField(default=False)            # Archive state

    meta = {"collection": "files"}

    def to_dict(self):
        return {
            "id": str(self.id),
            "filename": self.filename,
            "path": self.path,
            "uploaded_by": {
                "id": str(self.uploaded_by.id),
                "email": self.uploaded_by.email
            } if self.uploaded_by else None,
            "project": str(self.project.id) if self.project else None,
            "filetype": {
                "id": str(self.filetype.id),
                "name": self.filetype.name
            } if self.filetype else None,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
            "is_archived": self.is_archived
        }
