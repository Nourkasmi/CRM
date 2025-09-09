from flask import Blueprint, request, jsonify
from src.controllers.auth_controller import (
    register_user, login_user, validate_user, forgot_password, reset_password
)
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

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return jsonify({"msg": "Successfully logged out"}), 200

# -----------------------------
# Forgot & Reset Password
# -----------------------------
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password_route():
    data = request.json
    return forgot_password(data)

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password_route():
    data = request.json
    return reset_password(data)
