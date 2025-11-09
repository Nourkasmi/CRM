from flask import jsonify
import re
from datetime import datetime
from flask_jwt_extended import create_access_token
from src.utils.password_helper import hash_password, verify_password
from src.utils.jwt_helper import generate_reset_token, verify_reset_token
from src.models.user_model import User
from src.utils.email_helper import send_validation_email, send_password_reset_email


def is_valid_email(email: str) -> bool:
    return re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email) is not None


def is_strong_password(password: str) -> bool:
    return (
        len(password) >= 8
        and re.search(r"[A-Z]", password)
        and re.search(r"[a-z]", password)
        and re.search(r"[0-9]", password)
        and re.search(r"[@$!%*?&]", password)
    )


def register_user(data):
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "user")

    if not name or not email or not password:
        return jsonify({"msg": "Missing required fields"}), 400

    if User.objects(email=email).first():
        return jsonify({"msg": "User already exists"}), 400

    if role == "superuser" and User.objects(role="superuser").first():
        return jsonify({"msg": "Superuser already exists"}), 403

    user = User(
        name=name,
        email=email,
        password=hash_password(password),
        role=role,
        is_active=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    ).save()

    try:
        send_validation_email(user.to_dict())
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

    return jsonify({"msg": "User registered successfully", "id": str(user.id), "role": role, "is_active": False}), 201


def login_user(data):
    from src.utils.jwt_helper import generate_token  # ✅ ensure it's imported here

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"msg": "Missing email or password"}), 400

    user = User.objects(email=email).first()
    if not user or not verify_password(password, user.password):
        return jsonify({"msg": "Invalid credentials"}), 401

    if not user.is_active:
        return jsonify({"msg": "Account not validated yet."}), 403

    # ✅ Generate token using the correct helper (string subject)
    token = generate_token(str(user.id), user.role, user.is_active)

    return jsonify({
        "access_token": token,
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_validated": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
    }), 200


def validate_user(user_id, current_user):
    if not current_user:
        return jsonify({"msg": "Unauthorized"}), 403

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if user.is_active:
        return jsonify({"msg": "User already active"}), 400

    role = current_user.get("role") if isinstance(current_user, dict) else None
    if user.role == "manager" and role != "superuser":
        return jsonify({"msg": "Only superusers can validate managers"}), 403
    elif user.role == "user" and role not in ["manager", "superuser"]:
        return jsonify({"msg": "Only managers or superusers can validate users"}), 403

    user.update(set__is_active=True, set__updated_at=datetime.utcnow())
    return jsonify({"msg": f"User {user.email} validated successfully"}), 200


def forgot_password(data):
    email = data.get("email")
    if not email:
        return jsonify({"msg": "Email is required"}), 400

    user = User.objects(email=email).first()
    if user:
        try:
            token = generate_reset_token(str(user.id))
            send_password_reset_email(user.to_dict(), token)
        except Exception as e:
            print(f"❌ Failed to send reset email: {e}")

    return jsonify({"msg": "If the email exists, a reset link has been sent."}), 200


def reset_password(data):
    token = data.get("token")
    new_password = data.get("new_password")

    if not token or not new_password:
        return jsonify({"msg": "Missing token or new password"}), 400

    user_id = verify_reset_token(token)
    if not user_id:
        return jsonify({"msg": "Invalid or expired token"}), 400

    if not is_strong_password(new_password):
        return jsonify({"msg": "Password does not meet strength requirements"}), 400

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    user.update(set__password=hash_password(new_password), set__updated_at=datetime.utcnow())
    return jsonify({"msg": "Password reset successful"}), 200
