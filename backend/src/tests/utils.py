from src.models.user_model import User

def login(client, email, password):
    resp = client.post("/auth/login", json={
        "email": email,
        "password": password
    })
    assert resp.status_code == 200, f"Login failed: {resp.get_json()}"
    return resp.get_json()["token"]

def register_user(test_client, name, email, password, role="user"):
    resp = test_client.post("/auth/register", json={
        "name": name,
        "email": email,
        "password": password,
        "role": role
    })
    assert resp.status_code == 201

    # ✅ auto-validate for tests
    user = User.objects(email=email).first()
    user.update(set__is_active=True)

    return email, password

