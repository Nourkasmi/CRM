from flask_jwt_extended import get_jwt_identity
from flask import jsonify
from functools import wraps

# Define hierarchy
ROLE_HIERARCHY = {
    "user": 1,       # low-level human
    "manager": 2,    # prophet
    "superuser": 3   # god
}

def role_required(min_role):
    """
    Restrict access based on role hierarchy and account activation.
    - min_role: "user", "manager", or "superuser"
    - user must have role >= min_role
    - user must be active (except superuser)
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            identity = get_jwt_identity()
            user_role = identity.get("role")
            is_active = identity.get("is_active", False)

            # If role not recognized → forbid
            if user_role not in ROLE_HIERARCHY:
                return jsonify({"msg": "Forbidden: Unknown role"}), 403

            # Role hierarchy check
            if ROLE_HIERARCHY[user_role] < ROLE_HIERARCHY[min_role]:
                return jsonify({"msg": "Forbidden: Insufficient role"}), 403

            # Activation check (except superuser)
            if user_role != "superuser" and not is_active:
                return jsonify({"msg": "Forbidden: Account not validated"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
