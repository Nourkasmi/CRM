from datetime import datetime

def user_schema():
    """
    Default schema for a user document in MongoDB.
    """
    return {
        "name": "",
        "email": "",
        "password": "",
        "role": "user",          # user, manager, superuser
        "is_active": False,      # must be approved to log in
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
