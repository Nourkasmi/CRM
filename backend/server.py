from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
from src.config.db import init_db
from src.routes.auth_routes import auth_bp
from src.routes.user_routes import user_bp
from src.routes.project_routes import project_bp
from src.routes.task_routes import task_bp
from src.routes.phase_routes import phase_bp
from src.routes.file_routes import file_bp
from src.routes.filetype_routes import filetype_bp
from src.middlewares.error_handlers import register_error_handlers
from src.config.mail import init_mail   # 👈 added

app = Flask(__name__)
CORS(app)

# -------------------------
# JWT Configuration
# -------------------------
app.config["JWT_SECRET_KEY"] = "dev-secret"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=4)  # Tokens expire after 4 hours
jwt = JWTManager(app)

# Init DB
init_db(app)

# Init Mail
init_mail(app)  # 👈 added

# Register routes
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(user_bp, url_prefix="/users")
app.register_blueprint(project_bp, url_prefix="/projects")
app.register_blueprint(task_bp, url_prefix="/tasks")
app.register_blueprint(phase_bp, url_prefix="/phases")
app.register_blueprint(file_bp, url_prefix="/files")           
app.register_blueprint(filetype_bp, url_prefix="/filetypes")

# Register global error handlers
register_error_handlers(app, jwt)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
