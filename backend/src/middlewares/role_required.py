from flask_jwt_extended import get_jwt, get_jwt_identity
from flask import jsonify
from functools import wraps

# Define hierarchy once
ROLE_HIERARCHY = {
    "user": 1,
    "manager": 2,
    "superuser": 3
}

def role_required(min_role):
    """
    Middleware that checks user's role based on JWT claims.
    Works with new string-based JWT identity.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            identity = get_jwt_identity()

            user_role = claims.get("role")
            is_active = claims.get("is_active", False)

            if not user_role or user_role not in ROLE_HIERARCHY:
                return jsonify({"msg": "Forbidden: Unknown role"}), 403

            # Role comparison
            if ROLE_HIERARCHY[user_role] < ROLE_HIERARCHY[min_role]:
                return jsonify({"msg": "Forbidden: Insufficient role"}), 403

            # Only non-superusers require validation
            if user_role != "superuser" and not is_active:
                return jsonify({"msg": "Forbidden: Account not validated"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
