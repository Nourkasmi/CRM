import pytest
from mongoengine import connect, disconnect
import mongomock
from src.models.user_model import User
from src.utils.password_helper import hash_password
from server import app  # adjust if your entrypoint file is different

# ✅ Superuser credentials
SUPER_EMAIL = "super@portal.com"
SUPER_PASS = "SuperAdmin@123"

@pytest.fixture(scope="session", autouse=True)
def test_db():
    """Setup a separate in-memory test database using mongomock."""
    disconnect()  # disconnect any real MongoDB connection
    connect(
        "cms_test",
        host="mongodb://localhost",  # dummy URI
        mongo_client_class=mongomock.MongoClient,  # ✅ correct way now
    )
    yield
    disconnect()

@pytest.fixture(autouse=True)
def seed_superuser():
    """Ensure a superuser always exists in the test DB before each test run."""
    User.drop_collection()  # reset users collection

    if not User.objects(email=SUPER_EMAIL).first():
        User(
            name="Super Admin",
            email=SUPER_EMAIL,
            password=hash_password(SUPER_PASS),
            role="superuser",
            is_active=True,
        ).save()

@pytest.fixture
def test_client():
    """Flask test client for API calls."""
    return app.test_client()
