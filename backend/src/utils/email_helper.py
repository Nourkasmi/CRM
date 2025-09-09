from flask_mail import Message
from src.config.mail import mail
from src.models.user_model import User

def send_validation_email(user_dict):
    """
    Send validation email to the appropriate admins when a new user registers.
    user_dict should come from user.to_dict()
    """
    role = user_dict.get("role")

    if role == "user":
        admins = User.objects(role__in=["manager", "superuser"], is_active=True).only("email")
    elif role == "manager":
        admins = User.objects(role="superuser", is_active=True).only("email")
    else:
        return

    recipients = [a.email for a in admins]

    if not recipients:
        print(" No admins found to notify.")
        return

    #  Direct backend endpoint (JWT still required)
    validation_link = f"http://localhost:5000/auth/validate/{user_dict['id']}"

    subject = " New Account Pending Validation"
    body = f"""
    A new {role} has registered and requires validation:

    Name: {user_dict['name']}
    Email: {user_dict['email']}

     To validate, send a POST request to:
    {validation_link}

    ( You must be logged in as manager/superuser and include your JWT token)
    """

    msg = Message(subject=subject, recipients=recipients, body=body)
    mail.send(msg)
    print(f" Validation email sent to {recipients}")
    print(" Validation link:", validation_link)


def send_password_reset_email(user_dict, token):
    """
    Send password reset email with a link containing the token.
    user_dict should come from user.to_dict()
    """
    reset_link = f"http://localhost:3000/reset-password?token={token}"  # adjust once frontend exists

    subject = "🔑 Reset Your Password"
    body = f"""
    Hello {user_dict['name']},

    You requested a password reset. Please click the link below to set a new password:
    {reset_link}

    This link will expire in 15 minutes. If you did not request this, please ignore this email.
    """

    msg = Message(subject=subject, recipients=[user_dict["email"]], body=body)
    mail.send(msg)

    print(f" Reset email sent to {user_dict['email']}")
    print(" Reset link:", reset_link)
