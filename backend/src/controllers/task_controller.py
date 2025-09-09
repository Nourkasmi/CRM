from flask import jsonify
from datetime import datetime
from src.models.task_model import Task
from src.models.phase_model import Phase
from src.models.user_model import User

# -------------------------------
# Helpers
# -------------------------------
def parse_deadline(deadline_str):
    if not deadline_str:
        return None
    try:
        return datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
    except Exception:
        return None


# -------------------------------
# Create a new task (user, manager, or superuser)
# -------------------------------
def create_task(data, current_user):
    if current_user.get("role") not in ["superuser", "manager", "user"]:
        return jsonify({"msg": "Only superusers, managers, or users can create tasks"}), 403

    title = data.get("title")
    description = data.get("description", "")
    phase_id = data.get("phase_id")
    deadline_str = data.get("deadline")
    assigned_user_id = data.get("assigned_user_id")  # 👈 required for manager/superuser

    if not title or not phase_id:
        return jsonify({"msg": "Task title and phase_id are required"}), 400

    phase = Phase.objects(id=phase_id).first()
    if not phase:
        return jsonify({"msg": "Phase not found"}), 404

    # Managers can only create tasks in projects they manage
    project = phase.project
    if current_user.get("role") == "manager" and \
       str(current_user["id"]) not in [str(m.id) for m in project.managers] and \
       str(current_user["id"]) != str(project.created_by.id):
        return jsonify({"msg": "You are not authorized to create tasks in this project"}), 403

    creator = User.objects(id=current_user["id"]).first()
    if not creator:
        return jsonify({"msg": "Creator not found"}), 404

    deadline = parse_deadline(deadline_str)
    if deadline_str and deadline is None:
        return jsonify({"msg": f"Invalid date format: {deadline_str}"}), 400

    # -------------------------------
    # Assignment rules
    # -------------------------------
    assigned_to = []

    if current_user.get("role") == "user":
        # Auto-assign task to the user who created it
        assigned_to = [creator]

        # 👇 Auto-add creator to project members if not already
        if creator not in project.members:
            project.update(push__members=creator, set__updated_at=datetime.utcnow())

    else:  # manager or superuser
        if not assigned_user_id:
            return jsonify({
                "msg": "Managers and superusers must assign the task to a user. "
                       "Please provide 'assigned_user_id'."
            }), 400

        assigned_user = User.objects(id=assigned_user_id, role="user", is_active=True).first()
        if not assigned_user:
            return jsonify({"msg": "Assigned user not found or inactive"}), 404

        assigned_to = [assigned_user]

        # 👇 Auto-add assigned user to project members if not already
        if assigned_user not in project.members:
            project.update(push__members=assigned_user, set__updated_at=datetime.utcnow())

    task = Task(
        title=title,
        description=description,
        phase=phase,
        created_by=creator,
        deadline=deadline,
        assigned_to=assigned_to
    ).save()

    return jsonify({
        "msg": "Task created successfully",
        "task": task.to_dict()
    }), 201



# -------------------------------
# Assign task to a user (manager/superuser only)
# -------------------------------
def assign_task(task_id, user_id, current_user):
    if current_user.get("role") not in ["superuser", "manager"]:
        return jsonify({"msg": "Only managers or superusers can assign tasks"}), 403

    task = Task.objects(id=task_id).first()
    if not task:
        return jsonify({"msg": "Task not found"}), 404

    project = task.phase.project
    user = User.objects(id=user_id, role="user", is_active=True).first()
    if not user:
        return jsonify({"msg": "User not found or inactive"}), 404

    if current_user.get("role") == "manager" and \
       str(current_user["id"]) not in [str(m.id) for m in project.managers] and \
       str(current_user["id"]) != str(project.created_by.id):
        return jsonify({"msg": "You are not authorized to assign tasks in this project"}), 403

    if user in task.assigned_to:
        return jsonify({"msg": "User already assigned to this task"}), 400

    # 👇 Assign user to task
    task.update(push__assigned_to=user)

    # 👇 Auto-add user to project members if not already
    if user not in project.members:
        project.update(push__members=user, set__updated_at=datetime.utcnow())

    return jsonify({"msg": f"Task assigned to {user.email}"}), 200


# -------------------------------
# Get all tasks for a phase
# -------------------------------
def get_tasks(phase_id, current_user):
    phase = Phase.objects(id=phase_id).first()
    if not phase:
        return jsonify({"msg": "Phase not found"}), 404

    tasks = Task.objects(phase=phase)
    return jsonify([t.to_dict() for t in tasks]), 200


# -------------------------------
# Update a task (superuser/manager only)
# -------------------------------
def update_task(task_id, data, current_user):
    task = Task.objects(id=task_id).first()
    if not task:
        return jsonify({"msg": "Task not found"}), 404

    project = task.phase.project
    if current_user.get("role") == "manager" and \
       str(current_user["id"]) not in [str(m.id) for m in project.managers] and \
       str(current_user["id"]) != str(project.created_by.id):
        return jsonify({"msg": "You are not authorized to update tasks in this project"}), 403

    update_fields = {}
    if "title" in data:
        update_fields["set__title"] = data["title"]
    if "description" in data:
        update_fields["set__description"] = data["description"]
    if "status" in data:
        if data["status"] not in ["todo", "in_progress", "done"]:
            return jsonify({"msg": "Invalid status"}), 400
        update_fields["set__status"] = data["status"]
    if "deadline" in data:
        deadline = parse_deadline(data["deadline"])
        if deadline is None:
            return jsonify({"msg": f"Invalid date format: {data['deadline']}"}), 400
        update_fields["set__deadline"] = deadline

    if not update_fields:
        return jsonify({"msg": "No valid fields to update"}), 400

    update_fields["set__created_at"] = datetime.utcnow()
    task.update(**update_fields)

    return jsonify({"msg": "Task updated successfully"}), 200


# -------------------------------
# Delete a task (superuser/manager only)
# -------------------------------
def delete_task(task_id, current_user):
    task = Task.objects(id=task_id).first()
    if not task:
        return jsonify({"msg": "Task not found"}), 404

    project = task.phase.project
    if current_user.get("role") == "manager" and \
       str(current_user["id"]) not in [str(m.id) for m in project.managers] and \
       str(current_user["id"]) != str(project.created_by.id):
        return jsonify({"msg": "You are not authorized to delete tasks in this project"}), 403

    task.delete()
    return jsonify({"msg": "Task deleted successfully"}), 200
