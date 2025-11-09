from flask import Blueprint, request
from src.middlewares.auth_middleware import jwt_required_custom
from src.controllers import filetype_controller as controller

filetype_bp = Blueprint("filetypes", __name__)

# -----------------------
# Create a new file type
# -----------------------
@filetype_bp.route("/", methods=["POST"])
@jwt_required_custom
def create_filetype():
    data = request.json
    return controller.create_filetype(data)

# -----------------------
# Get all file types
# -----------------------
@filetype_bp.route("/", methods=["GET"])
@jwt_required_custom
def get_filetypes():
    return controller.get_filetypes()

# -----------------------
# Delete a file type
# -----------------------
@filetype_bp.route("/<filetype_id>", methods=["DELETE"])
@jwt_required_custom
def delete_filetype(filetype_id):
    return controller.delete_filetype(filetype_id)
