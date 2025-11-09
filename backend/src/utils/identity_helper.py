from flask_jwt_extended import get_jwt

def parse_identity(identity):
    """
    Unified identity parser that works for both:
    - string-based JWTs (default)
    - dict-based JWTs (legacy)
    Returns (user_id, role, is_active)
    """
    if isinstance(identity, dict):
        return (
            identity.get("id"),
            identity.get("role"),
            identity.get("is_active", False)
        )

    # when identity is a string (default case)
    claims = get_jwt()
    return (
        identity,
        claims.get("role"),
        claims.get("is_active", False)
    )


def is_superuser(current_user):
    user_id, role, _ = parse_identity(current_user)
    return role == "superuser"


def is_manager(current_user):
    user_id, role, _ = parse_identity(current_user)
    return role in ["manager", "superuser"]
