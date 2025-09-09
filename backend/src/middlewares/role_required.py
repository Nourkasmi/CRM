from flask_jwt_extended import get_jwt_identity
from flask import jsonify
from functools import wraps

ROLE_HIERARCHY = {
    "user": 1,
    "manager": 2,
    "superuser": 3
}

def role_required(min_role):

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            identity = get_jwt_identity()
            user_role = identity.get("role")
            is_active = identity.get("is_active", False)

            if user_role not in ROLE_HIERARCHY:
                return jsonify({"msg": "Forbidden: Unknown role"}), 403

            if ROLE_HIERARCHY[user_role] < ROLE_HIERARCHY[min_role]:
                return jsonify({"msg": "Forbidden: Insufficient role"}), 403

            if user_role != "superuser" and not is_active:
                return jsonify({"msg": "Forbidden: Account not validated"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
