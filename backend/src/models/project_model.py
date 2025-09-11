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
        try:
            from src.models.phase_model import Phase  # éviter circular import

            return {
                "id": str(self.id),
                "name": self.name,
                "description": self.description or "",
                "deadline": self.deadline.isoformat() if self.deadline else None,
                "created_by": {
                    "id": str(self.created_by.id),
                    "email": getattr(self.created_by, "email", None)
                } if self.created_by else None,
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "updated_at": self.updated_at.isoformat() if self.updated_at else None,
                "is_archived": self.is_archived,
                "managers": [
                    {"id": str(m.id), "email": getattr(m, "email", None)}
                    for m in (self.managers or []) if m
                ],
                "members": [
                    {"id": str(u.id), "email": getattr(u, "email", None)}
                    for u in (self.members or []) if u
                ],
                "assigned_to": [
                    {"id": str(u.id), "email": getattr(u, "email", None)}
                    for u in ((self.managers or []) + (self.members or [])) if u
                ],
                "phases": [p.to_dict() for p in Phase.objects(project=self)]
            }
        except Exception as e:
            import traceback
            print("🔥 ERROR in Project.to_dict():", str(e))
            traceback.print_exc()
            return {"id": str(self.id), "error": str(e)}
