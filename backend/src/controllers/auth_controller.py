from flask import jsonify
from bson import ObjectId
import re
from datetime import datetime
from src.config.db import mongo
from src.utils.password_helper import hash_password, verify_password
from src.utils.jwt_helper import generate_token
from src.models.user_model import user_schema

# -------------------------------
# Helpers for validation
# -------------------------------
def is_valid_email(email: str) -> bool:
    """Validate email format with regex"""
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return re.match(email_regex, email) is not None

def is_strong_password(password: str) -> bool:
    """Check password strength: ≥8 chars, 1 upper, 1 lower, 1 digit, 1 special"""
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[@$!%*?&]", password):
        return False
    return True

# -------------------------------
# Controllers
# -------------------------------
def register_user(data):
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "user")

    if not name or not email or not password:
        return jsonify({"msg": "Missing required fields"}), 400

    # Prevent duplicate emails
    if mongo.db.users.find_one({"email": email}):
        return jsonify({"msg": "User already exists"}), 400

    # Restrict superuser creation if one already exists
    if role == "superuser":
        existing_super = mongo.db.users.find_one({"role": "superuser"})
        if existing_super:
            return jsonify({"msg": "Superuser already exists"}), 403

    # Hash password
    hashed_pw = hash_password(password)

    # Create user object
    user = {
        "name": name,
        "email": email,
        "password": hashed_pw,
        "role": role,
        "is_active": True
    }

    result = mongo.db.users.insert_one(user)

    return jsonify({
        "msg": "User registered successfully",
        "id": str(result.inserted_id),
        "role": role,
        "is_active": True
    }), 201

def login_user(data):
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"msg": "Missing email or password"}), 400

    user = mongo.db.users.find_one({"email": email})
    if not user or not verify_password(password, user["password"]):
        return jsonify({"msg": "Invalid credentials"}), 401

    # Check if user is active
    if not user.get("is_active", False):
        return jsonify({"msg": "Account not validated yet. Please wait for superuser approval."}), 403

    # Generate token with is_active included
    token = generate_token(str(user["_id"]), user["role"], user["is_active"])

    return jsonify({
        "token": token,
        "role": user["role"],
        "id": str(user["_id"]),
        "is_active": user["is_active"]
    }), 200


def validate_user(user_id, current_user):
    """Superuser validates a user (sets is_active=True)."""
    if not current_user or current_user.get("role") != "superuser":
        return jsonify({"msg": "Only superusers can validate accounts"}), 403

    try:
        obj_id = ObjectId(user_id)
    except:
        return jsonify({"msg": "Invalid user ID"}), 400

    user = mongo.db.users.find_one({"_id": obj_id})
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if user.get("is_active", False):
        return jsonify({"msg": "User already active"}), 400

    mongo.db.users.update_one({"_id": obj_id}, {"$set": {"is_active": True, "updated_at": datetime.utcnow()}})

    return jsonify({"msg": f"User {user['email']} validated successfully"}), 200
