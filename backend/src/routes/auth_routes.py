from flask import Blueprint, request
from src.controllers.auth_controller import register_user, login_user, validate_user
from flask_jwt_extended import jwt_required, get_jwt_identity

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    return register_user(data)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    return login_user(data)

@auth_bp.route("/validate/<user_id>", methods=["POST"])
@jwt_required()
def validate(user_id):
    current_user = get_jwt_identity()
    return validate_user(user_id, current_user)
