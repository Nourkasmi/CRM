from flask import jsonify
from datetime import datetime
from mongoengine.queryset.visitor import Q
from src.models.project_model import Project
from src.models.user_model import User
from src.models.phase_model import Phase   # 👈 new import

# -------------------------------
# Create a new project (superuser or manager)
# -------------------------------
def create_project(data, current_user):
    if current_user.get("role") not in ["superuser", "manager"]:
        return jsonify({"msg": "Only superusers or managers can create projects"}), 403

    name = data.get("name")
    description = data.get("description", "")
    deadline = data.get("deadline")  # optional

    if not name:
        return jsonify({"msg": "Project name is required"}), 400

    creator = User.objects(id=current_user["id"]).first()
    if not creator:
        return jsonify({"msg": "Creator not found"}), 404

    project = Project(
        name=name,
        description=description,
        created_by=creator,
        deadline=deadline
    )

    # ✅ If the creator is a manager, auto-assign them
    if current_user.get("role") == "manager":
        project.managers = [creator]

    project.save()

    # ✅ Create default phases
    default_phases = ["Planning", "Execution", "Closure"]
    for pname in default_phases:
        Phase(name=pname, project=project).save()

    return jsonify({
        "msg": "Project created successfully with default phases",
        "project": project.to_dict()
    }), 201


# -------------------------------
# Assign a manager to project (superuser only)
# -------------------------------
def assign_manager(project_id, manager_id, current_user):
    if current_user.get("role") != "superuser":
        return jsonify({"msg": "Only superusers can assign managers"}), 403

    project = Project.objects(id=project_id).first()
    if not project:
        return jsonify({"msg": "Project not found"}), 404

    manager = User.objects(id=manager_id, role="manager", is_active=True).first()
    if not manager:
        return jsonify({"msg": "Manager not found or inactive"}), 404

    if manager in project.managers:
        return jsonify({"msg": "Manager already assigned"}), 400

    project.update(push__managers=manager, set__updated_at=datetime.utcnow())
    return jsonify({"msg": f"Manager {manager.email} assigned to project"}), 200


# -------------------------------
# Assign user to project (manager/superuser only)
# -------------------------------
def assign_user(project_id, user_id, current_user):
    if current_user.get("role") not in ["manager", "superuser"]:
        return jsonify({"msg": "Only managers or superusers can assign users"}), 403

    project = Project.objects(id=project_id).first()
    if not project:
        return jsonify({"msg": "Project not found"}), 404

    user = User.objects(id=user_id, role="user", is_active=True).first()
    if not user:
        return jsonify({"msg": "User not found or inactive"}), 404

    # Managers can only assign users to their own projects
    if current_user.get("role") == "manager" and str(current_user["id"]) not in [str(m.id) for m in project.managers] and str(current_user["id"]) != str(project.created_by.id):
        return jsonify({"msg": "You are not authorized to assign users to this project"}), 403

    if user in project.members:
        return jsonify({"msg": "User already assigned"}), 400

    project.update(push__members=user, set__updated_at=datetime.utcnow())
    return jsonify({"msg": f"User {user.email} assigned to project"}), 200


# -------------------------------
# Get all projects (filtered by role)
# -------------------------------
def get_projects(current_user):
    role = current_user.get("role")
    user_id = current_user.get("id")

    if role == "superuser":
        projects = Project.objects()
    elif role == "manager":
        projects = Project.objects(Q(created_by=user_id) | Q(managers__in=[user_id]))
    else:  # normal user
        projects = Project.objects(members__in=[user_id])

    return jsonify([p.to_dict() for p in projects]), 200


# -------------------------------
# Get single project (filtered by role)
# -------------------------------
def get_project(project_id, current_user):
    project = Project.objects(id=project_id).first()
    if not project:
        return jsonify({"msg": "Project not found"}), 404

    role = current_user.get("role")
    user_id = current_user.get("id")

    if role == "superuser":
        pass
    elif role == "manager" and str(user_id) not in [str(m.id) for m in project.managers] and str(user_id) != str(project.created_by.id):
        return jsonify({"msg": "You are not authorized to view this project"}), 403
    elif role == "user" and str(user_id) not in [str(m.id) for m in project.members]:
        return jsonify({"msg": "You are not authorized to view this project"}), 403

    return jsonify(project.to_dict()), 200


# -------------------------------
# Update project (superuser or manager if owns/assigned)
# -------------------------------
def update_project(project_id, data, current_user):
    project = Project.objects(id=project_id).first()
    if not project:
        return jsonify({"msg": "Project not found"}), 404

    role = current_user.get("role")
    user_id = current_user.get("id")

    if role != "superuser" and str(user_id) not in [str(m.id) for m in project.managers] and str(user_id) != str(project.created_by.id):
        return jsonify({"msg": "Only superuser or authorized manager can update this project"}), 403

    update_fields = {}
    if "name" in data:
        update_fields["set__name"] = data["name"]
    if "description" in data:
        update_fields["set__description"] = data["description"]
    if "deadline" in data:
        update_fields["set__deadline"] = data["deadline"]

    if not update_fields:
        return jsonify({"msg": "No valid fields to update"}), 400

    update_fields["set__updated_at"] = datetime.utcnow()
    project.update(**update_fields)

    return jsonify({"msg": "Project updated successfully"}), 200


# -------------------------------
# Delete project (superuser only)
# -------------------------------
def delete_project(project_id, current_user):
    if current_user.get("role") != "superuser":
        return jsonify({"msg": "Only superusers can delete projects"}), 403

    project = Project.objects(id=project_id).first()
    if not project:
        return jsonify({"msg": "Project not found"}), 404

    project.delete()
    return jsonify({"msg": "Project deleted successfully"}), 200

# -------------------------------
# Archive or Unarchive project (superuser only)
# -------------------------------
def archive_project(project_id, current_user, archive=True):
    if current_user.get("role") != "superuser":
        return jsonify({"msg": "Only superusers can archive projects"}), 403

    project = Project.objects(id=project_id).first()
    if not project:
        return jsonify({"msg": "Project not found"}), 404

    project.update(set__is_archived=archive, set__updated_at=datetime.utcnow())
    return jsonify({"msg": f"Project {'archived' if archive else 'unarchived'} successfully"}), 200
