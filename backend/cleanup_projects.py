from src.config.db import init_db
from src.models.project_model import Project
from src.models.user_model import User
from bson import ObjectId, DBRef

def normalize_id(value):
    """Return a safe ObjectId from ObjectId, str, or DBRef"""
    if isinstance(value, ObjectId):
        return value
    if isinstance(value, DBRef):
        return value.id
    if isinstance(value, str):
        try:
            return ObjectId(value)
        except Exception:
            return None
    return None

def cleanup_projects():
    print("🔍 Starting cleanup...")
    fixed_projects = 0

    for project in Project.objects():
        changed = False

        # --- Handle created_by safely ---
        created_by_id = None
        raw_created_by = project._data.get("created_by")
        created_by_id = normalize_id(raw_created_by)

        if created_by_id and not User.objects(id=created_by_id).first():
            print(f"⚠️ Removing invalid created_by from project {project.id}")
            project.update(unset__created_by=1)
            changed = True

        # --- Handle managers safely ---
        valid_managers = []
        for m in project._data.get("managers", []):
            mid = normalize_id(m)
            if mid and User.objects(id=mid).first():
                valid_managers.append(m)

        if len(valid_managers) != len(project._data.get("managers", [])):
            print(f"⚠️ Cleaning managers in project {project.id}")
            project.update(set__managers=valid_managers)
            changed = True

        # --- Handle members safely ---
        valid_members = []
        for u in project._data.get("members", []):
            uid = normalize_id(u)
            if uid and User.objects(id=uid).first():
                valid_members.append(u)

        if len(valid_members) != len(project._data.get("members", [])):
            print(f"⚠️ Cleaning members in project {project.id}")
            project.update(set__members=valid_members)
            changed = True

        if changed:
            fixed_projects += 1
            print(f"✅ Project {project.id} fixed")

    print(f"🎉 Cleanup complete. {fixed_projects} projects fixed.")

if __name__ == "__main__":
    init_db(None)  # ✅ connect to DB
    cleanup_projects()
