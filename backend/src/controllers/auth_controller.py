from flask import jsonify
import re
from datetime import datetime
from src.utils.password_helper import hash_password, verify_password
from src.utils.jwt_helper import generate_token, generate_reset_token, verify_reset_token
from src.models.user_model import User
from src.utils.email_helper import send_validation_email, send_password_reset_email  # 👈 added

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

    if User.objects(email=email).first():
        return jsonify({"msg": "User already exists"}), 400

    if role == "superuser":
        existing_super = User.objects(role="superuser").first()
        if existing_super:
            return jsonify({"msg": "Superuser already exists"}), 403

    hashed_pw = hash_password(password)

    user = User(
        name=name,
        email=email,
        password=hashed_pw,
        role=role,
        is_active=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    ).save()

    # -------------------------
    # Send validation email
    # -------------------------
    try:
        send_validation_email(user.to_dict())
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

    return jsonify({
        "msg": "User registered successfully",
        "id": str(user.id),
        "role": role,
        "is_active": False
    }), 201


def login_user(data):
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"msg": "Missing email or password"}), 400

    user = User.objects(email=email).first()
    if not user or not verify_password(password, user.password):
        return jsonify({"msg": "Invalid credentials"}), 401

    if not user.is_active:
        return jsonify({"msg": "Account not validated yet."}), 403

    token = generate_token(str(user.id), user.role, user.is_active)

    return jsonify({
        "token": token,
        "role": user.role,
        "id": str(user.id),
        "is_active": user.is_active
    }), 200


def validate_user(user_id, current_user):
    """Validation rules:
       - Superuser can validate managers + users
       - Manager can validate users
    """
    if not current_user:
        return jsonify({"msg": "Unauthorized"}), 403

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if user.is_active:
        return jsonify({"msg": "User already active"}), 400

    target_role = user.role
    current_role = current_user.get("role")

    if target_role == "manager":
        if current_role != "superuser":
            return jsonify({"msg": "Only superusers can validate managers"}), 403

    elif target_role == "user":
        if current_role not in ["manager", "superuser"]:
            return jsonify({"msg": "Only managers or superusers can validate users"}), 403

    else:
        return jsonify({"msg": f"Validation not allowed for role: {target_role}"}), 403

    user.update(
        set__is_active=True,
        set__updated_at=datetime.utcnow()
    )

    return jsonify({"msg": f"User {user.email} ({target_role}) validated successfully"}), 200


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

    # Always return generic response
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

    hashed_pw = hash_password(new_password)
    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    user.update(
        set__password=hashed_pw,
        set__updated_at=datetime.utcnow()
    )

    return jsonify({"msg": "Password reset successful"}), 200
