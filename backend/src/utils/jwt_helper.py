from flask_jwt_extended import create_access_token

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
