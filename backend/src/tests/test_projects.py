import pytest
from server import app  
from flask import Flask

# Superuser credentials (already in DB)
SUPER_EMAIL = "super@example.com"
SUPER_PASS = "SuperPass1!"

# -------------------------
# Helper functions
# -------------------------
def register_user(test_client, name, email, password, role="user"):
    """Register a new user (inactive by default)."""
    resp = test_client.post(
        "/auth/register",
        json={"name": name, "email": email, "password": password, "role": role},
    )
    assert resp.status_code == 201
    return email, password

def login(test_client, email, password):
    """Login and return JWT token."""
    resp = test_client.post("/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.get_json()["token"]

def validate_user(test_client, user_id, token):
    """Validate a user with superuser token."""
    resp = test_client.post(
        f"/auth/validate/{user_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200


# -------------------------
# Fixtures
# -------------------------
@pytest.fixture
def test_client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


# -------------------------
# Tests
# -------------------------

def test_superuser_can_create_project(test_client):
    token = login(test_client, SUPER_EMAIL, SUPER_PASS)

    resp = test_client.post(
        "/projects/",
        json={"name": "Project1", "description": "First project"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    assert resp.get_json()["project"]["name"] == "Project1"


def test_superuser_can_assign_manager(test_client):
    # 1. Register a manager
    email, password = register_user(
        test_client, "Manager1", "manager1@test.com", "ManagerPass1!", "manager"
    )

    # 2. Superuser login
    su_token = login(test_client, SUPER_EMAIL, SUPER_PASS)

    # 3. Get manager ID
    resp = test_client.get("/users/", headers={"Authorization": f"Bearer {su_token}"})
    manager_id = [u for u in resp.get_json() if u["email"] == email][0]["id"]

    # 4. Validate manager
    validate_user(test_client, manager_id, su_token)

    # 5. Create project
    resp = test_client.post(
        "/projects/",
        json={"name": "Project2", "description": "With manager"},
        headers={"Authorization": f"Bearer {su_token}"},
    )
    assert resp.status_code == 201
    project_id = resp.get_json()["project"]["id"]

    # 6. Assign manager
    resp = test_client.post(
        f"/projects/{project_id}/assign-manager/{manager_id}",
        headers={"Authorization": f"Bearer {su_token}"},
    )
    assert resp.status_code == 200


def test_manager_can_assign_user(test_client):
    # 1. Register manager + user
    m_email, m_pass = register_user(
        test_client, "Manager2", "manager2@test.com", "ManagerPass2!", "manager"
    )
    u_email, u_pass = register_user(
        test_client, "User1", "user1@test.com", "UserPass1!"
    )

    # 2. Superuser login
    su_token = login(test_client, SUPER_EMAIL, SUPER_PASS)

    # 3. Get manager + user IDs
    resp = test_client.get("/users/", headers={"Authorization": f"Bearer {su_token}"})
    manager_id = [u for u in resp.get_json() if u["email"] == m_email][0]["id"]
    user_id = [u for u in resp.get_json() if u["email"] == u_email][0]["id"]

    # 4. Validate manager and user
    validate_user(test_client, manager_id, su_token)
    validate_user(test_client, user_id, su_token)

    # 5. Create project as superuser
    resp = test_client.post(
        "/projects/",
        json={"name": "Project3", "description": "With users"},
        headers={"Authorization": f"Bearer {su_token}"},
    )
    project_id = resp.get_json()["project"]["id"]

    # 6. Assign manager to project
    resp = test_client.post(
        f"/projects/{project_id}/assign-manager/{manager_id}",
        headers={"Authorization": f"Bearer {su_token}"},
    )
    assert resp.status_code == 200

    # 7. Manager login
    m_token = login(test_client, m_email, m_pass)

    # 8. Assign user to project
    resp = test_client.post(
        f"/projects/{project_id}/assign-user/{user_id}",
        headers={"Authorization": f"Bearer {m_token}"},
    )
    assert resp.status_code == 200


def test_get_projects(test_client):
    token = login(test_client, SUPER_EMAIL, SUPER_PASS)
    resp = test_client.get("/projects/", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200


def test_update_project(test_client):
    token = login(test_client, SUPER_EMAIL, SUPER_PASS)

    # Create project
    resp = test_client.post(
        "/projects/",
        json={"name": "ProjectUpdate", "description": "Old desc"},
        headers={"Authorization": f"Bearer {token}"},
    )
    project_id = resp.get_json()["project"]["id"]

    # Update project
    resp = test_client.put(
        f"/projects/{project_id}",
        json={"name": "UpdatedName"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200


def test_delete_project(test_client):
    token = login(test_client, SUPER_EMAIL, SUPER_PASS)

    # Create project
    resp = test_client.post(
        "/projects/",
        json={"name": "ProjectDelete", "description": "To delete"},
        headers={"Authorization": f"Bearer {token}"},
    )
    project_id = resp.get_json()["project"]["id"]

    # Delete project
    resp = test_client.delete(
        f"/projects/{project_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
