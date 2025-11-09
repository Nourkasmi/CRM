from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from functools import wraps
from flask import g

def jwt_required_custom(fn):
    """
    Wrapper around verify_jwt_in_request with debug logging.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            claims = get_jwt()
            print("✅ JWT VERIFIED:", claims)
        except Exception as e:
            print("❌ JWT VERIFICATION FAILED:", e)
            from flask import jsonify
            return jsonify({"error": str(e)}), 422
        return fn(*args, **kwargs)
    return wrapper