from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from src.controllers import filetype_controller as controller

filetype_bp = Blueprint("filetypes", __name__)

@filetype_bp.route("/", methods=["POST"])
@jwt_required()
def create_filetype():
    data = request.json
    return controller.create_filetype(data)

@filetype_bp.route("/", methods=["GET"])
@jwt_required()
def get_filetypes():
    return controller.get_filetypes()

@filetype_bp.route("/<filetype_id>", methods=["DELETE"])
@jwt_required()
def delete_filetype(filetype_id):
    return controller.delete_filetype(filetype_id)
