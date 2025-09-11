from flask import Flask, jsonify
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
from src.config.mail import init_mail
import traceback

app = Flask(__name__)

# ✅ Strict CORS configuration for frontend (Vite on 5173)
CORS(
    app,
    resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
)

# -------------------------
# JWT Configuration
# -------------------------
app.config["JWT_SECRET_KEY"] = "dev-secret"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=4)
app.config["JWT_TOKEN_LOCATION"] = ["headers"]

jwt = JWTManager(app)

# -------------------------
# Global catch-all error handler (for debugging 500)
# -------------------------
@app.errorhandler(Exception)
def handle_exception(e):
    print("🔥 SERVER ERROR:", str(e))
    traceback.print_exc()   # affiche la stack complète
    return jsonify({"msg": f"Internal error: {str(e)}"}), 500

# -------------------------
# Init DB & Mail
# -------------------------
init_db(app)
init_mail(app)

# -------------------------
# Register routes with /api prefix
# -------------------------
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(user_bp, url_prefix="/api/users")
app.register_blueprint(project_bp, url_prefix="/api/projects")
app.register_blueprint(task_bp, url_prefix="/api/tasks")
app.register_blueprint(phase_bp, url_prefix="/api/phases")
app.register_blueprint(file_bp, url_prefix="/api/files")
app.register_blueprint(filetype_bp, url_prefix="/api/filetypes")

# -------------------------
# Register JWT-specific error handlers
# -------------------------
register_error_handlers(app, jwt)

# -------------------------
# Run server
# -------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
