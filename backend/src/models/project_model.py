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

            # ✅ Safe deref for created_by
            created_by_data = None
            if self.created_by and getattr(self.created_by, "id", None):
                created_by_data = {
                    "id": str(self.created_by.id),
                    "email": getattr(self.created_by, "email", None)
                }

            # ✅ Safe deref for managers
            safe_managers = []
            for m in (self.managers or []):
                if m and getattr(m, "id", None):
                    safe_managers.append({"id": str(m.id), "email": getattr(m, "email", None)})

            # ✅ Safe deref for members
            safe_members = []
            for u in (self.members or []):
                if u and getattr(u, "id", None):
                    safe_members.append({"id": str(u.id), "email": getattr(u, "email", None)})

            return {
                "id": str(self.id),
                "name": self.name,
                "description": self.description or "",
                "deadline": self.deadline.isoformat() if self.deadline else None,
                "created_by": created_by_data,
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "updated_at": self.updated_at.isoformat() if self.updated_at else None,
                "is_archived": self.is_archived,
                "managers": safe_managers,
                "members": safe_members,
                "assigned_to": safe_managers + safe_members,
                "phases": [p.to_dict() for p in Phase.objects(project=self)]
            }
        except Exception as e:
            import traceback
            print("🔥 ERROR in Project.to_dict():", str(e))
            traceback.print_exc()
            return {"id": str(self.id), "error": str(e)}
