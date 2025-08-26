from flask_mail import Mail

mail = Mail()

def init_mail(app):
    app.config['MAIL_SERVER'] = "smtp.gmail.com"
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = "crm.portal97@gmail.com"
    app.config['MAIL_PASSWORD'] = "ycoi cptp mfvf wqav"
    app.config['MAIL_DEFAULT_SENDER'] = "crm.portal97@gmail.com"

    mail.init_app(app)
    return mail
