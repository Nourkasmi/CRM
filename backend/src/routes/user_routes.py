from flask import Blueprint, request, jsonify
from bson import ObjectId
from werkzeug.security import generate_password_hash
from src.config.db import mongo
from src.middlewares.auth_middleware import jwt_required_custom
from src.middlewares.role_required import role_required
from flask_jwt_extended import get_jwt

user_bp = Blueprint("users", __name__)

# -----------------------
# GET all users (manager + superuser)
# -----------------------
@user_bp.route("/", methods=["GET"])
@jwt_required_custom
@role_required("manager")   # manager and above
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
    claims = get_jwt()
    requester_id = claims.get("id")
    role = claims.get("role")
    is_active = claims.get("is_active", False)

    # Self-access allowed if active
    if requester_id == user_id and is_active:
        pass
    # Manager or superuser can access any user
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
# Approve user (only superuser)
# -----------------------
@user_bp.route("/<user_id>/approve", methods=["PUT"])
@jwt_required_custom
@role_required("superuser")
def approve_user(user_id):
    result = mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": True}}
    )
    if result.matched_count == 0:
        return jsonify({"msg": "User not found"}), 404
    return jsonify({"msg": "User approved and can now log in"}), 200


# -----------------------
# Update own profile (self only, if active)
# -----------------------
@user_bp.route("/me", methods=["PUT"])
@jwt_required_custom
@role_required("user")  # any active user can update self
def update_profile():
    claims = get_jwt()
    user_id = claims.get("id")
    is_active = claims.get("is_active", False)

    if not is_active:
        return jsonify({"msg": "Account not validated"}), 403

    data = request.json
    update_fields = {}

    if "name" in data:
        update_fields["name"] = data["name"]
    if "password" in data:
        update_fields["password"] = generate_password_hash(data["password"])

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
