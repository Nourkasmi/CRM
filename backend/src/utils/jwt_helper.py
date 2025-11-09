from flask_jwt_extended import create_access_token, decode_token
from datetime import timedelta

def generate_token(user_id, role, is_active):
    """
    Generate JWT including user id, role, and activation status.
    """
    return create_access_token(
        identity=str(user_id),  # ✅ subject must be a string
        additional_claims={
            "role": role,
            "is_active": is_active
        }
    )

def generate_reset_token(user_id):
    """
    Generate short-lived JWT for password reset (15 min).
    """
    return create_access_token(
        identity=str(user_id),
        additional_claims={"purpose": "reset_password"},
        expires_delta=timedelta(minutes=15)
    )

def verify_reset_token(token):
    """
    Verify reset token and return user_id if valid.
    """
    try:
        decoded = decode_token(token)
        identity = decoded.get("sub")
        claims = decoded.get("claims", {})
        if claims.get("purpose") != "reset_password":
            return None
        return identity
    except Exception as e:
        print("❌ ERROR VERIFYING RESET TOKEN:", e)
        return None
