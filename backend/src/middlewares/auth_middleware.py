from flask_jwt_extended import verify_jwt_in_request
from functools import wraps

def jwt_required_custom(fn):
    """
    Wrapper around verify_jwt_in_request.
    Relies on global JWT error handlers for proper responses.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        return fn(*args, **kwargs)
    return wrapper
