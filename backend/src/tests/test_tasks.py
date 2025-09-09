import pytest
from server import app
from src.tests.utils import register_user, login
from src.models.project_model import Project
from src.models.task_model import Task
from src.models.user_model import User

SUPER_EMAIL = "super@portal.com"
SUPER_PASS = "SuperAdmin@123"

@pytest.fixture
def test_client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------
def create_project(test_client, token, name="ProjX"):
    resp = test_client.post(
        "/projects/",
        json={"name": name, "description": "Task testing"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    return resp.get_json()["project"]["id"]

def create_task(test_client, token, project_id, title="TaskX"):
    resp = test_client.post(
        "/tasks/",
        json={"title": title, "project_id": project_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    return resp

# ----------------------------------------------------------------------
# TESTS
# ----------------------------------------------------------------------

def test_superuser_can_create_task(test_client):
    token = login(test_client, SUPER_EMAIL, SUPER_PASS)
    project_id = create_project(test_client, token)
    resp = create_task(test_client, token, project_id, "Super Task")
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["task"]["title"] == "Super Task"


def test_manager_can_create_task_in_own_project(test_client):
    # 1. Create manager
    m_email, m_pass = register_user(test_client, "ManagerX", "managerx@test.com", "ManagerPass1!", "manager")
    su_token = login(test_client, SUPER_EMAIL, SUPER_PASS)
    # 2. Create project and assign manager
    project_id = create_project(test_client, su_token, "Manager Project")
    resp = test_client.get("/users/", headers={"Authorization": f"Bearer {su_token}"})
    manager_id = [u for u in resp.get_json() if u["email"] == m_email][0]["id"]
    test_client.post(f"/projects/{project_id}/assign-manager/{manager_id}", headers={"Authorization": f"Bearer {su_token}"})
    # 3. Login manager
    m_token = login(test_client, m_email, m_pass)
    resp = create_task(test_client, m_token, project_id, "Manager Task")
    assert resp.status_code == 201


def test_user_cannot_create_task(test_client):
    u_email, u_pass = register_user(test_client, "UserX", "userx@test.com", "UserPass1!")
    u_token = login(test_client, u_email, u_pass)
    project_id = Project.objects.first().id  # grab an existing project
    resp = create_task(test_client, u_token, str(project_id), "Invalid Task")
    assert resp.status_code == 403


def test_superuser_can_assign_task_to_user(test_client):
    # Create user
    u_email, u_pass = register_user(test_client, "UserAssign", "userassign@test.com", "UserPass2!")
    su_token = login(test_client, SUPER_EMAIL, SUPER_PASS)
    # Create project + task
    project_id = create_project(test_client, su_token, "Assign Project")
    resp = create_task(test_client, su_token, project_id, "Task To Assign")
    task_id = resp.get_json()["task"]["id"]
    # Get user id
    resp = test_client.get("/users/", headers={"Authorization": f"Bearer {su_token}"})
    user_id = [u for u in resp.get_json() if u["email"] == u_email][0]["id"]
    # Assign
    resp = test_client.post(
        f"/tasks/{task_id}/assign/{user_id}",
        headers={"Authorization": f"Bearer {su_token}"},
    )
    assert resp.status_code == 200


def test_manager_cannot_assign_task_in_unowned_project(test_client):
    # Register manager
    m_email, m_pass = register_user(test_client, "ManagerY", "managery@test.com", "ManagerPass3!", "manager")
    m_token = login(test_client, m_email, m_pass)
    # Superuser creates project + task (without assigning manager)
    su_token = login(test_client, SUPER_EMAIL, SUPER_PASS)
    project_id = create_project(test_client, su_token, "Restricted Project")
    resp = create_task(test_client, su_token, project_id, "Restricted Task")
    task_id = resp.get_json()["task"]["id"]
    # Try to assign user
    u_email, u_pass = register_user(test_client, "UserY", "usery@test.com", "UserPass3!")
    resp = test_client.get("/users/", headers={"Authorization": f"Bearer {su_token}"})
    user_id = [u for u in resp.get_json() if u["email"] == u_email][0]["id"]
    resp = test_client.post(
        f"/tasks/{task_id}/assign/{user_id}",
        headers={"Authorization": f"Bearer {m_token}"},
    )
    assert resp.status_code == 403


def test_update_task_by_creator(test_client):
    su_token = login(test_client, SUPER_EMAIL, SUPER_PASS)
    project_id = create_project(test_client, su_token, "Update Project")
    resp = create_task(test_client, su_token, project_id, "Old Task")
    task_id = resp.get_json()["task"]["id"]
    resp = test_client.put(
        f"/tasks/{task_id}",
        json={"title": "New Task", "status": "done"},
        headers={"Authorization": f"Bearer {su_token}"},
    )
    assert resp.status_code == 200


def test_delete_task_by_creator(test_client):
    su_token = login(test_client, SUPER_EMAIL, SUPER_PASS)
    project_id = create_project(test_client, su_token, "Delete Project")
    resp = create_task(test_client, su_token, project_id, "Temp Task")
    task_id = resp.get_json()["task"]["id"]
    resp = test_client.delete(
        f"/tasks/{task_id}", headers={"Authorization": f"Bearer {su_token}"}
    )
    assert resp.status_code == 200
