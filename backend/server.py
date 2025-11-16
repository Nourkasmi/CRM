from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_jwt_extended.exceptions import JWTExtendedException
from datetime import timedelta
from flasgger import Swagger

# --- Internal Imports ---
from src.config.db import init_db
from src.config.mail import init_mail
from src.routes.auth_routes import auth_bp
from src.routes.user_routes import user_bp
from src.routes.project_routes import project_bp
from src.routes.task_routes import task_bp
from src.routes.phase_routes import phase_bp
from src.routes.file_routes import file_bp
from src.routes.filetype_routes import filetype_bp
from src.ml_api.app import ml_bp
from src.middlewares.error_handlers import register_error_handlers


# ----------------------------------------------------
# 🧠 APP INITIALIZATION
# ----------------------------------------------------
app = Flask(__name__)
swagger = Swagger(app)

# ----------------------------------------------------
# 🌐 CORS CONFIGURATION (Frontend ↔ Backend bridge)
# ----------------------------------------------------
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://localhost:5173",
    "https://127.0.0.1:5173",
    "https://amuzay-consulting.netlify.app",
    "https://portalcms.netlify.app",
]

CORS(
    app,
    resources={r"/api/*": {"origins": allowed_origins}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
)

# ✅ Ensure every response includes CORS headers (even errors)
@app.after_request
def apply_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
    else:
        # fallback to * if origin not matched (so 500 errors still carry CORS headers)
        response.headers["Access-Control-Allow-Origin"] = "*"

    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Vary"] = "Origin"
    return response

# ----------------------------------------------------
# 🔐 JWT CONFIGURATION
# ----------------------------------------------------
app.config["JWT_SECRET_KEY"] = "dev-secret"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=4)
app.config["JWT_TOKEN_LOCATION"] = ["headers"]

jwt = JWTManager(app)

# ----------------------------------------------------
# ⚙️ INIT DATABASE & MAIL
# ----------------------------------------------------
init_db(app)
init_mail(app)

# ----------------------------------------------------
# 🔗 BLUEPRINT REGISTRATION
# ----------------------------------------------------
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(user_bp, url_prefix="/api/users")
app.register_blueprint(project_bp, url_prefix="/api/projects")
app.register_blueprint(task_bp, url_prefix="/api/tasks")
app.register_blueprint(phase_bp, url_prefix="/api/phases")
app.register_blueprint(file_bp, url_prefix="/api/files")
app.register_blueprint(filetype_bp, url_prefix="/api/filetypes")
app.register_blueprint(ml_bp, url_prefix="/api/ml")


# ----------------------------------------------------
# 🧱 GLOBAL ERROR HANDLERS
# ----------------------------------------------------
register_error_handlers(app, jwt)

@app.errorhandler(JWTExtendedException)
def handle_jwt_errors(e):
    print("❌ JWT ERROR:", e)
    return jsonify({"error": str(e)}), 422

@app.errorhandler(422)
def handle_unprocessable_entity(e):
    response = getattr(e, "description", str(e))
    print("🚨 422 ERROR:", response)
    return jsonify({"error": "Unprocessable Entity", "details": response}), 422

@app.errorhandler(500)
def handle_internal_error(e):
    print("🔥 INTERNAL SERVER ERROR:", e)
    return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# ----------------------------------------------------
# 🚀 START FLASK SERVER
# ----------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
