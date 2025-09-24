from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.middlewares.role_required import role_required
from src.controllers import task_controller as controller

task_bp = Blueprint("tasks", __name__)

# -----------------------
# Create a task
# -----------------------
@task_bp.route("/", methods=["POST"])
@jwt_required()
@role_required("user")  # ✅ allow user, manager, superuser
def create_task():
    data = request.json
    current_user = get_jwt_identity()
    return controller.create_task(data, current_user)


# -----------------------
# Assign a task to user(s)
# -----------------------
@task_bp.route("/<task_id>/assign/<user_id>", methods=["POST"])
@jwt_required()
@role_required("manager")  # ✅ managers & superusers
def assign_task(task_id, user_id):
    current_user = get_jwt_identity()
    return controller.assign_task(task_id, user_id, current_user)


# -----------------------
# Get all tasks for a phase
# -----------------------
@task_bp.route("/phase/<phase_id>", methods=["GET"])
@jwt_required()  # ✅ all authenticated users can see tasks
def get_tasks(phase_id):
    current_user = get_jwt_identity()
    return controller.get_tasks(phase_id, current_user)


# -----------------------
# ✅ Get all tasks for a project
# -----------------------
@task_bp.route("/project/<project_id>", methods=["GET"])
@jwt_required()  # ✅ all authenticated users can see project tasks
def get_tasks_by_project(project_id):
    current_user = get_jwt_identity()
    return controller.get_tasks_by_project(project_id, current_user)


# -----------------------
# Update a task
# -----------------------
@task_bp.route("/<task_id>", methods=["PUT"])
@jwt_required()
@role_required("manager")  # ✅ managers & superusers
def update_task(task_id):
    data = request.json
    current_user = get_jwt_identity()
    return controller.update_task(task_id, data, current_user)


# -----------------------
# Delete a task
# -----------------------
@task_bp.route("/<task_id>", methods=["DELETE"])
@jwt_required()
@role_required("manager")  # ✅ managers & superusers
def delete_task(task_id):
    current_user = get_jwt_identity()
    return controller.delete_task(task_id, current_user)


# -----------------------
# ✅ Complete task
# -----------------------
@task_bp.route("/<task_id>/complete", methods=["PUT"])
@jwt_required()
@role_required("user")  # ✅ users can complete their tasks
def complete_task(task_id):
    current_user = get_jwt_identity()
    return controller.complete_task(task_id, current_user)
