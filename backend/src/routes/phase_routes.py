from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from src.middlewares.auth_middleware import jwt_required_custom
from src.middlewares.role_required import role_required
from src.controllers import phase_controller as controller

phase_bp = Blueprint("phases", __name__)

# -----------------------
# Create a new custom phase (superuser/manager only)
# -----------------------
@phase_bp.route("/<project_id>", methods=["POST"])
@jwt_required_custom
@role_required("manager")
def create_phase(project_id):
    data = request.json
    current_user = get_jwt_identity()
    return controller.create_phase(project_id, data, current_user)

# -----------------------
# Get all phases for a project
# -----------------------
@phase_bp.route("/<project_id>", methods=["GET"])
@jwt_required_custom
def get_phases(project_id):
    current_user = get_jwt_identity()
    return controller.get_phases(project_id, current_user)

# -----------------------
# Update a phase
# -----------------------
@phase_bp.route("/update/<phase_id>", methods=["PUT"])
@jwt_required_custom
@role_required("manager")
def update_phase(phase_id):
    data = request.json
    current_user = get_jwt_identity()
    return controller.update_phase(phase_id, data, current_user)

# -----------------------
# Delete a phase
# -----------------------
@phase_bp.route("/<phase_id>", methods=["DELETE"])
@jwt_required_custom
@role_required("manager")
def delete_phase(phase_id):
    current_user = get_jwt_identity()
    return controller.delete_phase(phase_id, current_user)

# -----------------------
# ✅ Complete phase
# -----------------------
@phase_bp.route("/<phase_id>/complete", methods=["PUT"])
@jwt_required_custom
@role_required("manager")
def complete_phase(phase_id):
    current_user = get_jwt_identity()
    return controller.complete_phase(phase_id, current_user)
