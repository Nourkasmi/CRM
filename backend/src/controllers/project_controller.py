from flask import jsonify
from datetime import datetime
from bson import ObjectId
from mongoengine.queryset.visitor import Q
from src.models.project_model import Project
from src.models.user_model import User
from src.models.phase_model import Phase
from src.models.task_model import Task
from src.models.file_model import File
from src.utils.identity_helper import parse_identity  # ✅ Step 2: shared helper imported


# -------------------------------
# Create a new project (superuser or manager)
# -------------------------------
def create_project(data, current_user):
    user_id, role, is_active = parse_identity(current_user)
    if not user_id or role not in ["superuser", "manager"]:
        return jsonify({"msg": "Only superusers or managers can create projects"}), 403

    name = data.get("name")
    description = data.get("description", "")
    deadline = data.get("deadline")
    manager_ids = data.get("manager_ids", [])

    if not name or not deadline:
        return jsonify({"msg": "Project name and deadline are required"}), 400

    try:
        creator = User.objects(id=ObjectId(user_id)).first()
    except Exception:
        return jsonify({"msg": "Invalid user ID"}), 400

    if not creator:
        return jsonify({"msg": "Creator not found"}), 404

    managers = []

    if role == "manager":
        managers = [creator]
    elif role == "superuser":
        if manager_ids:
            managers = list(
                User.objects(id__in=[ObjectId(mid) for mid in manager_ids], role="manager", is_active=True)
            )
        if not managers:
            managers = [creator]

    project = Project(
        name=name,
        description=description,
        created_by=creator,
        deadline=deadline,
        managers=managers
    )
    project.save()

    default_phases = ["Planning", "Execution", "Closure"]
    for pname in default_phases:
        Phase(name=pname, project=project, deadline=deadline).save()

    return jsonify({
        "msg": "Project created successfully with default phases and managers",
        "project": project.to_dict()
    }), 201


# -------------------------------
# Assign a manager to project (superuser only)
# -------------------------------
def assign_manager(project_id, manager_id, current_user):
    user_id, role, is_active = parse_identity(current_user)
    if role != "superuser":
        return jsonify({"msg": "Only superusers can assign managers"}), 403

    try:
        project = Project.objects(id=ObjectId(project_id)).first()
    except Exception:
        return jsonify({"msg": "Invalid project ID"}), 400

    if not project:
        return jsonify({"msg": "Project not found"}), 404

    try:
        manager = User.objects(id=ObjectId(manager_id), role="manager", is_active=True).first()
    except Exception:
        return jsonify({"msg": "Invalid manager ID"}), 400

    if not manager:
        return jsonify({"msg": "Manager not found or inactive"}), 404

    if manager in project.managers:
        return jsonify({"msg": "Manager already assigned"}), 400

    project.update(push__managers=manager, set__updated_at=datetime.utcnow())
    return jsonify({"msg": f"Manager {manager.email} assigned to project"}), 200


# -------------------------------
# Assign user to project (manager/superuser only)
# -------------------------------
def assign_user(project_id, user_id_to_add, current_user):
    user_id, role, is_active = parse_identity(current_user)
    if role not in ["manager", "superuser"]:
        return jsonify({"msg": "Only managers or superusers can assign users"}), 403

    try:
        project = Project.objects(id=ObjectId(project_id)).first()
    except Exception:
        return jsonify({"msg": "Invalid project ID"}), 400

    if not project:
        return jsonify({"msg": "Project not found"}), 404

    try:
        user = User.objects(id=ObjectId(user_id_to_add), role="user", is_active=True).first()
    except Exception:
        return jsonify({"msg": "Invalid user ID"}), 400

    if not user:
        return jsonify({"msg": "User not found or inactive"}), 404

    try:
        current_user_id = ObjectId(user_id)
    except Exception:
        return jsonify({"msg": "Invalid current user ID"}), 400

    if role == "manager" and current_user_id not in [m.id for m in project.managers] and current_user_id != project.created_by.id:
        return jsonify({"msg": "You are not authorized to assign users to this project"}), 403

    if user in project.members:
        return jsonify({"msg": "User already assigned"}), 400

    project.update(push__members=user, set__updated_at=datetime.utcnow())
    return jsonify({"msg": f"User {user.email} assigned to project"}), 200


# -------------------------------
# Get all projects (filtered by role)
# -------------------------------
def get_projects(current_user):
    user_id, role, is_active = parse_identity(current_user)
    if not user_id:
        return jsonify({"msg": "Unauthorized"}), 401

    try:
        user_obj_id = ObjectId(user_id)
    except Exception as e:
        return jsonify({"msg": f"Invalid user ID: {str(e)}"}), 400

    try:
        if role == "superuser":
            projects = Project.objects()
        elif role == "manager":
            projects = Project.objects(Q(created_by=user_obj_id) | Q(managers__in=[user_obj_id]))
        else:
            projects = Project.objects(members__in=[user_obj_id])

        project_dicts = [p.to_dict() for p in projects]
        return jsonify(project_dicts), 200

    except Exception as e:
        return jsonify({"msg": f"Unexpected server error: {str(e)}"}), 500


# -------------------------------
# Get single project (filtered by role)
# -------------------------------
def get_project(project_id, current_user):
    try:
        project = Project.objects(id=ObjectId(project_id)).first()
    except Exception:
        return jsonify({"msg": "Invalid project ID"}), 400

    if not project:
        return jsonify({"msg": "Project not found"}), 404

    user_id, role, is_active = parse_identity(current_user)
    if not user_id:
        return jsonify({"msg": "Unauthorized"}), 401

    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        return jsonify({"msg": "Invalid user ID"}), 400

    if role == "superuser":
        pass
    elif role == "manager" and user_obj_id not in [m.id for m in project.managers] and user_obj_id != project.created_by.id:
        return jsonify({"msg": "You are not authorized to view this project"}), 403
    elif role == "user" and user_obj_id not in [m.id for m in project.members]:
        return jsonify({"msg": "You are not authorized to view this project"}), 403

    return jsonify(project.to_dict()), 200


# -------------------------------
# Update project (superuser or manager)
# -------------------------------
def update_project(project_id, data, current_user):
    user_id, role, is_active = parse_identity(current_user)
    try:
        project = Project.objects(id=ObjectId(project_id)).first()
    except Exception:
        return jsonify({"msg": "Invalid project ID"}), 400

    if not project:
        return jsonify({"msg": "Project not found"}), 404

    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        return jsonify({"msg": "Invalid user ID"}), 400

    if role != "superuser" and user_obj_id not in [m.id for m in project.managers] and user_obj_id != project.created_by.id:
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
    user_id, role, is_active = parse_identity(current_user)
    if role != "superuser":
        return jsonify({"msg": "Only superusers can delete projects"}), 403

    try:
        project = Project.objects(id=ObjectId(project_id)).first()
    except Exception:
        return jsonify({"msg": "Invalid project ID"}), 400

    if not project:
        return jsonify({"msg": "Project not found"}), 404

    project.delete()
    return jsonify({"msg": "Project deleted successfully"}), 200


# -------------------------------
# Archive or Unarchive project
# -------------------------------
def archive_project(project_id, current_user, archive=True):
    user_id, role, is_active = parse_identity(current_user)
    if role != "superuser":
        return jsonify({"msg": "Only superusers can archive projects"}), 403

    try:
        project = Project.objects(id=ObjectId(project_id)).first()
    except Exception:
        return jsonify({"msg": "Invalid project ID"}), 400

    if not project:
        return jsonify({"msg": "Project not found"}), 404

    project.update(set__is_archived=archive, set__updated_at=datetime.utcnow())
    return jsonify({"msg": f"Project {'archived' if archive else 'unarchived'} successfully"}), 200


# -------------------------------
# ✅ Mark project as completed
# -------------------------------
def complete_project(project_id, current_user):
    user_id, role, is_active = parse_identity(current_user)
    project = Project.objects(id=ObjectId(project_id)).first()
    if not project:
        return jsonify({"msg": "Project not found"}), 404

    if role not in ["superuser", "manager"]:
        return jsonify({"msg": "Only superuser or manager can complete a project"}), 403

    project.update(set__status="completed", set__updated_at=datetime.utcnow())

    phases = Phase.objects(project=project)
    for phase in phases:
        phase.update(set__status="completed", set__updated_at=datetime.utcnow())
        Task.objects(phase=phase).update(set__status="done", set__updated_at=datetime.utcnow())

    return jsonify({"msg": "Project and all related phases & tasks marked as completed"}), 200


# -------------------------------
# Get all projects with aggregated stats
# -------------------------------
def get_projects_with_stats(current_user):
    user_id, role, is_active = parse_identity(current_user)
    if not user_id:
        return jsonify({"msg": "Unauthorized"}), 401

    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        return jsonify({"msg": "Invalid user ID"}), 400

    if role == "superuser":
        projects = Project.objects()
    elif role == "manager":
        projects = Project.objects(Q(created_by=user_obj_id) | Q(managers__in=[user_obj_id]))
    else:
        projects = Project.objects(members__in=[user_obj_id])

    results = []
    for p in projects:
        try:
            phase_qs = Phase.objects(project=p)
            task_qs = Task.objects(phase__in=phase_qs)
            file_qs = File.objects(project=p)

            project_data = p.to_dict()
            project_data.update({
                "phase_count": phase_qs.count(),
                "task_count": task_qs.count(),
                "file_count": file_qs.count(),
                "task_stats": {
                    "todo": task_qs.filter(status="todo").count(),
                    "in_progress": task_qs.filter(status="in_progress").count(),
                    "done": task_qs.filter(status="done").count(),
                },
                "file_stats": {
                    ft.filetype.name: file_qs.filter(filetype=ft.filetype).count()
                    for ft in file_qs.only("filetype") if ft.filetype
                }
            })
            results.append(project_data)
        except Exception as e:
            results.append({"id": str(p.id), "error": str(e)})

    return jsonify(results), 200
