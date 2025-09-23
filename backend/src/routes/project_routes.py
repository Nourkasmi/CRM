from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.middlewares.role_required import role_required
from src.controllers import project_controller as controller

project_bp = Blueprint("projects", __name__)

# -----------------------
# Create project (superuser or manager)
# -----------------------
@project_bp.route("/", methods=["POST"])
@jwt_required()
@role_required("manager")  # ✅ allows manager & superuser
def create_project():
    data = request.json
    current_user = get_jwt_identity()
    return controller.create_project(data, current_user)

# -----------------------
# Assign manager (superuser only)
# -----------------------
@project_bp.route("/<project_id>/assign-manager/<manager_id>", methods=["POST"])
@jwt_required()
@role_required("superuser")
def assign_manager(project_id, manager_id):
    current_user = get_jwt_identity()
    return controller.assign_manager(project_id, manager_id, current_user)

# -----------------------
# Assign user (manager/superuser only)
# -----------------------
@project_bp.route("/<project_id>/assign-user/<user_id>", methods=["POST"])
@jwt_required()
@role_required("manager")
def assign_user(project_id, user_id):
    current_user = get_jwt_identity()
    return controller.assign_user(project_id, user_id, current_user)

# -----------------------
# Get all projects (any authenticated user)
# -----------------------
@project_bp.route("/", methods=["GET"])
@jwt_required()
def get_projects():
    current_user = get_jwt_identity()
    return controller.get_projects(current_user)

# -----------------------
# Get single project (any authenticated user)
# -----------------------
@project_bp.route("/<project_id>", methods=["GET"])
@jwt_required()
def get_project(project_id):
    current_user = get_jwt_identity()
    return controller.get_project(project_id, current_user)

# -----------------------
# Update project (superuser or manager if owns/assigned)
# -----------------------
@project_bp.route("/<project_id>", methods=["PUT"])
@jwt_required()
@role_required("manager")
def update_project(project_id):
    data = request.json
    current_user = get_jwt_identity()
    return controller.update_project(project_id, data, current_user)

# -----------------------
# Delete project (superuser only)
# -----------------------
@project_bp.route("/<project_id>", methods=["DELETE"])
@jwt_required()
@role_required("superuser")
def delete_project(project_id):
    current_user = get_jwt_identity()
    return controller.delete_project(project_id, current_user)

# -----------------------
# Archive project (superuser only)
# -----------------------
@project_bp.route("/<project_id>/archive", methods=["POST"])
@jwt_required()
@role_required("superuser")
def archive_project(project_id):
    current_user = get_jwt_identity()
    return controller.archive_project(project_id, current_user, archive=True)

# -----------------------
# Unarchive project (superuser only)
# -----------------------
@project_bp.route("/<project_id>/unarchive", methods=["POST"])
@jwt_required()
@role_required("superuser")
def unarchive_project(project_id):
    current_user = get_jwt_identity()
    return controller.archive_project(project_id, current_user, archive=False)

# -----------------------
# ✅ Complete project (superuser/manager only)
# -----------------------
@project_bp.route("/<project_id>/complete", methods=["PUT"])
@jwt_required()
@role_required("manager")
def complete_project(project_id):
    current_user = get_jwt_identity()
    return controller.complete_project(project_id, current_user)
