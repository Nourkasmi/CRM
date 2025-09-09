from flask import jsonify
from datetime import datetime
from src.models.phase_model import Phase
from src.models.project_model import Project
from src.models.user_model import User

# -------------------------------
# Helpers
# -------------------------------
def parse_deadline(deadline_str):
    """Safely parse ISO8601 datetime strings into datetime objects."""
    if not deadline_str:
        return None
    try:
        # Accepts "2025-10-01T00:00:00" or with "Z"
        return datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
    except Exception:
        return None


# -------------------------------
# Create a new custom phase (superuser/manager only)
# -------------------------------
def create_phase(project_id, data, current_user):
    if current_user.get("role") not in ["superuser", "manager"]:
        return jsonify({"msg": "Only superusers or managers can create phases"}), 403

    project = Project.objects(id=project_id).first()
    if not project:
        return jsonify({"msg": "Project not found"}), 404

    # Manager can only add phases to projects they manage/own
    if current_user.get("role") == "manager" and \
       str(current_user["id"]) not in [str(m.id) for m in project.managers] and \
       str(current_user["id"]) != str(project.created_by.id):
        return jsonify({"msg": "You are not authorized to add phases to this project"}), 403

    name = data.get("name")
    deadline_str = data.get("deadline")
    deadline = parse_deadline(deadline_str)

    if not name:
        return jsonify({"msg": "Phase name is required"}), 400

    if deadline_str and deadline is None:
        return jsonify({"msg": f"Invalid date format: {deadline_str}"}), 400

    # Prevent duplicates by name within same project
    if Phase.objects(name=name, project=project).first():
        return jsonify({"msg": f"Phase '{name}' already exists in this project"}), 400

    phase = Phase(
        name=name,
        project=project,
        deadline=deadline
    ).save()

    return jsonify({"msg": "Phase created successfully", "phase": phase.to_dict()}), 201


# -------------------------------
# Get all phases of a project
# -------------------------------
def get_phases(project_id, current_user):
    project = Project.objects(id=project_id).first()
    if not project:
        return jsonify({"msg": "Project not found"}), 404

    role = current_user.get("role")
    user_id = current_user.get("id")

    # Check access
    if role != "superuser" and \
       str(user_id) not in [str(m.id) for m in project.managers] and \
       str(user_id) != str(project.created_by.id) and \
       str(user_id) not in [str(u.id) for u in project.members]:
        return jsonify({"msg": "You are not authorized to view this project's phases"}), 403

    phases = Phase.objects(project=project)
    return jsonify([p.to_dict() for p in phases]), 200


# -------------------------------
# Update a phase (superuser/manager only)
# -------------------------------
def update_phase(phase_id, data, current_user):
    phase = Phase.objects(id=phase_id).first()
    if not phase:
        return jsonify({"msg": "Phase not found"}), 404

    project = phase.project
    role = current_user.get("role")
    user_id = current_user.get("id")

    if role != "superuser" and str(user_id) not in [str(m.id) for m in project.managers]:
        return jsonify({"msg": "Only superuser or project manager can update this phase"}), 403

    update_fields = {}
    if "name" in data:
        update_fields["set__name"] = data["name"]
    if "deadline" in data:
        deadline = parse_deadline(data["deadline"])
        if deadline is None:
            return jsonify({"msg": f"Invalid date format: {data['deadline']}"}), 400
        update_fields["set__deadline"] = deadline

    if not update_fields:
        return jsonify({"msg": "No valid fields to update"}), 400

    update_fields["set__updated_at"] = datetime.utcnow()
    phase.update(**update_fields)

    return jsonify({"msg": "Phase updated successfully"}), 200


# -------------------------------
# Delete a phase (superuser/manager only)
# -------------------------------
def delete_phase(phase_id, current_user):
    phase = Phase.objects(id=phase_id).first()
    if not phase:
        return jsonify({"msg": "Phase not found"}), 404

    project = phase.project
    role = current_user.get("role")
    user_id = current_user.get("id")

    if role != "superuser" and str(user_id) not in [str(m.id) for m in project.managers]:
        return jsonify({"msg": "Only superuser or project manager can delete this phase"}), 403

    phase.delete()
    return jsonify({"msg": "Phase deleted successfully"}), 200
