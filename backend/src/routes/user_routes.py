from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from src.middlewares.auth_middleware import jwt_required_custom
from src.middlewares.role_required import role_required
from src.controllers import user_controller as controller

user_bp = Blueprint("users", __name__)

# -----------------------
# GET all users (manager + superuser)
# -----------------------
@user_bp.route("/", methods=["GET"])
@jwt_required_custom
@role_required("manager")
def get_users():
    return controller.get_users()


# -----------------------
# GET single user (self if active OR manager/superuser)
# -----------------------
@user_bp.route("/<user_id>", methods=["GET"])
@jwt_required_custom
def get_user(user_id):
    current_user = get_jwt_identity()
    return controller.get_user(user_id, current_user)


# -----------------------
# DELETE user (only superuser)
# -----------------------
@user_bp.route("/<user_id>", methods=["DELETE"])
@jwt_required_custom
@role_required("superuser")
def delete_user(user_id):
    return controller.delete_user(user_id)


# -----------------------
# Update own profile (self only, if active)
# -----------------------
@user_bp.route("/me", methods=["PUT"])
@jwt_required_custom
@role_required("user")
def update_profile():
    data = request.json
    current_user = get_jwt_identity()
    return controller.update_profile(data, current_user)


# -----------------------
# Change role (only superuser)
# -----------------------
@user_bp.route("/<user_id>/role", methods=["PUT"])
@jwt_required_custom
@role_required("superuser")
def update_role(user_id):
    new_role = request.json.get("role")
    return controller.update_role(user_id, new_role)


# -----------------------
# Reset own password (requires old password)
# -----------------------
@user_bp.route("/me/reset-password", methods=["PUT"])
@jwt_required_custom
@role_required("user")
def reset_own_password():
    data = request.json
    current_user = get_jwt_identity()
    return controller.reset_own_password(data, current_user)


# -----------------------
# Reset password (superuser resets any user)
# -----------------------
@user_bp.route("/<user_id>/reset-password", methods=["PUT"])
@jwt_required_custom
@role_required("superuser")
def reset_user_password(user_id):
    new_password = request.json.get("new_password")
    return controller.reset_user_password(user_id, new_password)
