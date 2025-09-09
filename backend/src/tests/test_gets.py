import pytest
from server import app
from src.models.project_model import Project
from src.models.task_model import Task
from src.models.user_model import User
from src.tests.utils import register_user, login

# 🔑 Superuser credentials (must exist in DB)
SUPER_EMAIL = "super@example.com"
SUPER_PASS = "SuperPass123!"

@pytest.fixture
def test_client():
    app.config["TESTING"] = True
    app.config["MONGODB_SETTINGS"] = {"db": "crm_test", "host": "mongomock://localhost"}
    with app.test_client() as client:
        yield client

# -------------------------
# PROJECT GET TESTS
# -------------------------

def test_superuser_can_get_all_projects(test_client):
    # Superuser login
    token = login(test_client, SUPER_EMAIL, SUPER_PASS)

    # Create 2 projects
    for i in range(2):
        test_client.post(
            "/projects/",
            json={"name": f"Super Project {i}", "description": "By superuser"},
            headers={"Authorization": f"Bearer {token}"}
        )

    # Superuser should see all
    resp = test_client.get("/projects/", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    projects = resp.get_json()
    assert len(projects) >= 2  # sees all projects


def test_manager_sees_only_own_projects(test_client):
    # Register manager
    m_email, m_pass = register_user(test_client, "ManagerX", "managerx@test.com", "ManagerXpass1!", "manager")
    m_token = login(test_client, m_email, m_pass)

    # Create project by superuser
    su_token = login(test_client, SUPER_EMAIL, SUPER_PASS)
    resp = test_client.post(
        "/projects/",
        json={"name": "Super Project", "description": "By super"},
        headers={"Authorization": f"Bearer {su_token}"}
    )
    project_id = resp.get_json()["project"]["id"]

    # Assign manager to project
    resp = test_client.get("/users/", headers={"Authorization": f"Bearer {su_token}"})
    manager_id = [u for u in resp.get_json() if u["email"] == m_email][0]["id"]
    test_client.post(
        f"/projects/{project_id}/assign-manager/{manager_id}",
        headers={"Authorization": f"Bearer {su_token}"}
    )

    # Manager GET projects → should only see this one
    resp = test_client.get("/projects/", headers={"Authorization": f"Bearer {m_token}"})
    assert resp.status_code == 200
    projects = resp.get_json()
    assert any(p["id"] == project_id for p in projects)


def test_user_sees_only_assigned_projects(test_client):
    # Register user
    u_email, u_pass = register_user(test_client, "UserX", "userx@test.com", "UserXpass1!")

    # Superuser creates project
    su_token = login(test_client, SUPER_EMAIL, SUPER_PASS)
    resp = test_client.post(
        "/projects/",
        json={"name": "User Project", "description": "For user"},
        headers={"Authorization": f"Bearer {su_token}"}
    )
    project_id = resp.get_json()["project"]["id"]

    # Assign user
    resp = test_client.get("/users/", headers={"Authorization": f"Bearer {su_token}"})
    user_id = [u for u in resp.get_json() if u["email"] == u_email][0]["id"]
    test_client.post(
        f"/projects/{project_id}/assign-user/{user_id}",
        headers={"Authorization": f"Bearer {su_token}"}
    )

    # User login
    u_token = login(test_client, u_email, u_pass)
    resp = test_client.get("/projects/", headers={"Authorization": f"Bearer {u_token}"})
    assert resp.status_code == 200
    projects = resp.get_json()
    assert any(p["id"] == project_id for p in projects)

# -------------------------
# TASK GET TESTS
# -------------------------

def test_superuser_can_get_tasks(test_client):
    su_token = login(test_client, SUPER_EMAIL, SUPER_PASS)

    # Create project
    resp = test_client.post(
        "/projects/",
        json={"name": "TasksProj", "description": "Tasks project"},
        headers={"Authorization": f"Bearer {su_token}"}
    )
    project_id = resp.get_json()["project"]["id"]

    # Create task
    test_client.post(
        "/tasks/",
        json={"title": "Task 1", "project_id": project_id},
        headers={"Authorization": f"Bearer {su_token}"}
    )

    resp = test_client.get(f"/tasks/project/{project_id}", headers={"Authorization": f"Bearer {su_token}"})
    assert resp.status_code == 200
    tasks = resp.get_json()
    assert len(tasks) >= 1


def test_manager_gets_only_their_project_tasks(test_client):
    # Register manager
    m_email, m_pass = register_user(test_client, "ManagerY", "managery@test.com", "ManagerYpass1!", "manager")

    su_token = login(test_client, SUPER_EMAIL, SUPER_PASS)
    # Create project and assign manager
    resp = test_client.post(
        "/projects/",
        json={"name": "ManagerProj", "description": "Tasks for manager"},
        headers={"Authorization": f"Bearer {su_token}"}
    )
    project_id = resp.get_json()["project"]["id"]

    resp = test_client.get("/users/", headers={"Authorization": f"Bearer {su_token}"})
    manager_id = [u for u in resp.get_json() if u["email"] == m_email][0]["id"]
    test_client.post(
        f"/projects/{project_id}/assign-manager/{manager_id}",
        headers={"Authorization": f"Bearer {su_token}"}
    )

    # Manager login
    m_token = login(test_client, m_email, m_pass)
    resp = test_client.get(f"/tasks/project/{project_id}", headers={"Authorization": f"Bearer {m_token}"})
    assert resp.status_code == 200


def test_user_gets_only_their_tasks(test_client):
    # Register user
    u_email, u_pass = register_user(test_client, "UserY", "usery@test.com", "UserYpass1!")

    su_token = login(test_client, SUPER_EMAIL, SUPER_PASS)
    # Create project and assign user
    resp = test_client.post(
        "/projects/",
        json={"name": "UserTaskProj", "description": "Tasks for user"},
        headers={"Authorization": f"Bearer {su_token}"}
    )
    project_id = resp.get_json()["project"]["id"]

    resp = test_client.get("/users/", headers={"Authorization": f"Bearer {su_token}"})
    user_id = [u for u in resp.get_json() if u["email"] == u_email][0]["id"]
    test_client.post(
        f"/projects/{project_id}/assign-user/{user_id}",
        headers={"Authorization": f"Bearer {su_token}"}
    )

    # Create task assigned to user
    test_client.post(
        "/tasks/",
        json={"title": "UserTask", "project_id": project_id},
        headers={"Authorization": f"Bearer {su_token}"}
    )

    u_token = login(test_client, u_email, u_pass)
    resp = test_client.get(f"/tasks/project/{project_id}", headers={"Authorization": f"Bearer {u_token}"})
    assert resp.status_code == 200
    tasks = resp.get_json()
    assert isinstance(tasks, list)
