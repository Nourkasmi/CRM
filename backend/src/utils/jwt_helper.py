from flask_jwt_extended import create_access_token, decode_token
from datetime import timedelta

def generate_token(user_id, role, is_active):
    """
    Generate JWT including user id, role, and activation status.
    """
    return create_access_token(
        identity={
            "id": str(user_id),
            "role": role,
            "is_active": is_active
        }
    )

def generate_reset_token(user_id):
    """
    Generate short-lived JWT for password reset (15 min).
    """
    return create_access_token(
        identity={"id": str(user_id), "purpose": "reset_password"},
        expires_delta=timedelta(minutes=15)
    )

def verify_reset_token(token):
    """
    Verify reset token and return user_id if valid.
    """
    try:
        decoded = decode_token(token)
        identity = decoded.get("sub", {})
        if not isinstance(identity, dict):
            return None
        if identity.get("purpose") != "reset_password":
            return None
        return identity.get("id")
    except Exception:
        return None

