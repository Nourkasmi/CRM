from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from src.middlewares.auth_middleware import jwt_required_custom
from src.controllers import file_controller as controller

file_bp = Blueprint("files", __name__)

# -------------------------------
# Upload file
# -------------------------------
@file_bp.route("/", methods=["POST"])
@jwt_required_custom
def upload_file():
    current_user = get_jwt_identity()
    return controller.upload_file(request, current_user)

# -------------------------------
# Get all files
# -------------------------------
@file_bp.route("/", methods=["GET"])
@jwt_required_custom
def get_all_files():
    include_archived = request.args.get("include_archived", "false").lower() == "true"
    return controller.get_all_files(include_archived)

# -------------------------------
# Get all files for a project
# -------------------------------
@file_bp.route("/project/<project_id>", methods=["GET"])
@jwt_required_custom
def get_project_files(project_id):
    include_archived = request.args.get("include_archived", "false").lower() == "true"
    return controller.get_project_files(project_id, include_archived)

# -------------------------------
# Download file
# -------------------------------
@file_bp.route("/<file_id>/download", methods=["GET"])
@jwt_required_custom
def download_file(file_id):
    return controller.download_file(file_id)

# -------------------------------
# Archive file
# -------------------------------
@file_bp.route("/<file_id>/archive", methods=["POST"])
@jwt_required_custom
def archive_file(file_id):
    return controller.archive_file(file_id, archive=True)

# -------------------------------
# Unarchive file
# -------------------------------
@file_bp.route("/<file_id>/unarchive", methods=["POST"])
@jwt_required_custom
def unarchive_file(file_id):
    return controller.archive_file(file_id, archive=False)

# -------------------------------
# Delete file permanently
# -------------------------------
@file_bp.route("/<file_id>", methods=["DELETE"])
@jwt_required_custom
def delete_file(file_id):
    return controller.delete_file(file_id)
