from flask import jsonify
from datetime import datetime
from src.models.user_model import User
from src.utils.password_helper import hash_password, verify_password
from src.controllers.auth_controller import is_strong_password

# -----------------------
# Get all users
# -----------------------
def get_users():
    users = User.objects.only("id", "name", "email", "role", "is_active", "created_at", "updated_at")
    return jsonify([u.to_dict() for u in users]), 200


# -----------------------
# Get single user
# -----------------------
def get_user(user_id, current_user):
    requester_id = current_user.get("id")
    role = current_user.get("role")
    is_active = current_user.get("is_active", False)

    if requester_id == user_id and is_active:
        pass
    elif role in ["manager", "superuser"]:
        pass
    else:
        return jsonify({"msg": "Forbidden"}), 403

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify(user.to_dict()), 200


# -----------------------
# Delete user
# -----------------------
def delete_user(user_id):
    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    user.delete()
    return jsonify({"msg": "User deleted"}), 200


# -----------------------
# Update own profile
# -----------------------
def update_profile(data, current_user):
    user_id = current_user.get("id")
    is_active = current_user.get("is_active", False)

    if not is_active:
        return jsonify({"msg": "Account not validated"}), 403

    update_fields = {}
    if "name" in data:
        update_fields["name"] = data["name"]
    if "password" in data:
        if not is_strong_password(data["password"]):
            return jsonify({"msg": "Weak password. Must be ≥8 chars, with upper, lower, digit, special"}), 400
        update_fields["password"] = hash_password(data["password"])

    if not update_fields:
        return jsonify({"msg": "No valid fields to update"}), 400

    update_fields["updated_at"] = datetime.utcnow()

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    user.update(**{f"set__{k}": v for k, v in update_fields.items()})
    return jsonify({"msg": "Profile updated successfully"}), 200


# -----------------------
# Change role
# -----------------------
def update_role(user_id, new_role):
    if new_role not in ["user", "manager", "superuser"]:
        return jsonify({"msg": "Invalid role"}), 400

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    user.update(set__role=new_role)
    return jsonify({"msg": f"Role updated to {new_role}"}), 200


# -----------------------
# Validate user
# -----------------------
def validate_user(user_id):
    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if user.is_active:
        return jsonify({"msg": "User already validated"}), 400

    user.update(
        set__is_active=True,
        set__updated_at=datetime.utcnow()
    )
    return jsonify({"msg": f"User {user_id} validated successfully"}), 200


# -----------------------
# Reset own password
# -----------------------
def reset_own_password(data, current_user):
    user_id = current_user.get("id")
    is_active = current_user.get("is_active", False)

    if not is_active:
        return jsonify({"msg": "Account not validated"}), 403

    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        return jsonify({"msg": "Old and new password required"}), 400

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if not verify_password(old_password, user.password):
        return jsonify({"msg": "Old password is incorrect"}), 401

    if not is_strong_password(new_password):
        return jsonify({"msg": "Weak password. Must be ≥8 chars, with upper, lower, digit, special"}), 400

    hashed_pw = hash_password(new_password)
    user.update(
        set__password=hashed_pw,
        set__updated_at=datetime.utcnow()
    )
    return jsonify({"msg": "Password updated successfully"}), 200


# -----------------------
# Reset password (superuser resets any user without old password)
# -----------------------
def reset_user_password(user_id, new_password):
    if not new_password:
        return jsonify({"msg": "New password required"}), 400

    if not is_strong_password(new_password):
        return jsonify({"msg": "Weak password. Must be ≥8 chars, with upper, lower, digit, special"}), 400

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    hashed_pw = hash_password(new_password)
    user.update(
        set__password=hashed_pw,
        set__updated_at=datetime.utcnow()
    )

    return jsonify({"msg": f"Password for user {user_id} has been reset"}), 200
