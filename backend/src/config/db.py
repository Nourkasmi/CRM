from mongoengine import connect

def init_db(app):
    
    db_name = "crm_system"
    db_uri = f"mongodb://localhost:27017/{db_name}"

    connect(
        db=db_name,
        host=db_uri,
        alias="default"
    )

    return True  # just to mimic the old pattern
