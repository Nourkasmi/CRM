from datetime import datetime

def user_schema():
    """
    Default schema for a user document in MongoDB.
    """
    return {
        "name": "",
        "email": "",
        "password": "",
        "role": "user",
        "is_active": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
