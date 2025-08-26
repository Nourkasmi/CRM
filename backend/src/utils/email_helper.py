from flask_mail import Message
from src.config.mail import mail
from src.config.db import mongo

def send_validation_email(user):
    role = user.get("role")

    # Decide who to notify
    if role == "user":
        admins = mongo.db.users.find(
            {"role": {"$in": ["manager", "superuser"]}, "is_active": True},
            {"email": 1}
        )
    elif role == "manager":
        admins = mongo.db.users.find(
            {"role": "superuser", "is_active": True},
            {"email": 1}
        )
    else:
        # No validation mail for superuser
        return

    recipients = [a["email"] for a in admins]

    if not recipients:
        print("⚠️ No admins found to notify.")
        return

    # 👇 Direct backend endpoint (JWT still required)
    validation_link = f"http://localhost:5000/auth/validate/{user['_id']}"

    subject = "🔔 New Account Pending Validation"
    body = f"""
    A new {role} has registered and requires validation:

    Name: {user['name']}
    Email: {user['email']}

    👉 To validate, send a POST request to:
    {validation_link}

    (⚠️ You must be logged in as manager/superuser and include your JWT token)
    """

    msg = Message(subject=subject, recipients=recipients, body=body)
    mail.send(msg)
    print(f"📩 Validation email sent to {recipients}")
    print("👉 Validation link:", validation_link)


def send_password_reset_email(user, token):
    """
    Send password reset email with a link containing the token.
    """
    reset_link = f"http://localhost:3000/reset-password?token={token}"  # adjust once frontend exists

    subject = "🔑 Reset Your Password"
    body = f"""
    Hello {user['name']},

    You requested a password reset. Please click the link below to set a new password:
    {reset_link}

    This link will expire in 15 minutes. If you did not request this, please ignore this email.
    """

    msg = Message(subject=subject, recipients=[user["email"]], body=body)
    mail.send(msg)

    # Log for dev/debug
    print(f"📩 Reset email sent to {user['email']}")
    print("👉 Reset link:", reset_link)
