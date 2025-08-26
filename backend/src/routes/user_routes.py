from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from src.config.db import mongo
from src.middlewares.auth_middleware import jwt_required_custom
from src.middlewares.role_required import role_required
from flask_jwt_extended import get_jwt_identity
from src.utils.password_helper import hash_password, verify_password
from src.controllers.auth_controller import is_strong_password  # ✅ import validator

user_bp = Blueprint("users", __name__)

# -----------------------
# GET all users (manager + superuser)
# -----------------------
@user_bp.route("/", methods=["GET"])
@jwt_required_custom
@role_required("manager")
def get_users():
    users = list(mongo.db.users.find({}, {"password": 0}))
    for u in users:
        u["_id"] = str(u["_id"])
    return jsonify(users), 200


# -----------------------
# GET single user (self if active OR manager/superuser)
# -----------------------
@user_bp.route("/<user_id>", methods=["GET"])
@jwt_required_custom
def get_user(user_id):
    identity = get_jwt_identity()
    requester_id = identity.get("id")
    role = identity.get("role")
    is_active = identity.get("is_active", False)

    if requester_id == user_id and is_active:
        pass
    elif role in ["manager", "superuser"]:
        pass
    else:
        return jsonify({"msg": "Forbidden"}), 403

    user = mongo.db.users.find_one({"_id": ObjectId(user_id)}, {"password": 0})
    if not user:
        return jsonify({"msg": "User not found"}), 404

    user["_id"] = str(user["_id"])
    return jsonify(user), 200


# -----------------------
# DELETE user (only superuser)
# -----------------------
@user_bp.route("/<user_id>", methods=["DELETE"])
@jwt_required_custom
@role_required("superuser")
def delete_user(user_id):
    result = mongo.db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        return jsonify({"msg": "User not found"}), 404
    return jsonify({"msg": "User deleted"}), 200


# -----------------------
# Update own profile (self only, if active)
# -----------------------
@user_bp.route("/me", methods=["PUT"])
@jwt_required_custom
@role_required("user")
def update_profile():
    identity = get_jwt_identity()
    user_id = identity.get("id")
    is_active = identity.get("is_active", False)

    if not is_active:
        return jsonify({"msg": "Account not validated"}), 403

    data = request.json
    update_fields = {}

    if "name" in data:
        update_fields["name"] = data["name"]
    if "password" in data:
        if not is_strong_password(data["password"]):  # ✅ enforce strength
            return jsonify({"msg": "Weak password. Must be ≥8 chars, with upper, lower, digit, special"}), 400
        update_fields["password"] = hash_password(data["password"])

    if not update_fields:
        return jsonify({"msg": "No valid fields to update"}), 400

    update_fields["updated_at"] = datetime.utcnow()

    mongo.db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})
    return jsonify({"msg": "Profile updated successfully"}), 200


# -----------------------
# Change role (only superuser)
# -----------------------
@user_bp.route("/<user_id>/role", methods=["PUT"])
@jwt_required_custom
@role_required("superuser")
def update_role(user_id):
    new_role = request.json.get("role")
    if new_role not in ["user", "manager", "superuser"]:
        return jsonify({"msg": "Invalid role"}), 400

    result = mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role}}
    )
    if result.matched_count == 0:
        return jsonify({"msg": "User not found"}), 404

    return jsonify({"msg": f"Role updated to {new_role}"}), 200


# -----------------------
# Reset own password (requires old password, self only, if active)
# -----------------------
@user_bp.route("/me/reset-password", methods=["PUT"])
@jwt_required_custom
@role_required("user")  # ✅ hierarchy: allows user + manager + superuser
def reset_own_password():
    identity = get_jwt_identity()
    user_id = identity.get("id")
    is_active = identity.get("is_active", False)

    if not is_active:
        return jsonify({"msg": "Account not validated"}), 403

    data = request.json
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        return jsonify({"msg": "Old and new password required"}), 400

    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if not verify_password(old_password, user["password"]):
        return jsonify({"msg": "Old password is incorrect"}), 401

    if not is_strong_password(new_password):  # ✅ enforce strength
        return jsonify({"msg": "Weak password. Must be ≥8 chars, with upper, lower, digit, special"}), 400

    hashed_pw = hash_password(new_password)
    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": hashed_pw, "updated_at": datetime.utcnow()}}
    )
    return jsonify({"msg": "Password updated successfully"}), 200


# -----------------------
# Reset password (superuser resets any user without old password)
# -----------------------
@user_bp.route("/<user_id>/reset-password", methods=["PUT"])
@jwt_required_custom
@role_required("superuser")
def reset_user_password(user_id):
    data = request.json
    new_password = data.get("new_password")

    if not new_password:
        return jsonify({"msg": "New password required"}), 400

    if not is_strong_password(new_password):  # ✅ enforce strength
        return jsonify({"msg": "Weak password. Must be ≥8 chars, with upper, lower, digit, special"}), 400

    hashed_pw = hash_password(new_password)
    result = mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": hashed_pw, "updated_at": datetime.utcnow()}}
    )

    if result.matched_count == 0:
        return jsonify({"msg": "User not found"}), 404

    return jsonify({"msg": f"Password for user {user_id} has been reset"}), 200
