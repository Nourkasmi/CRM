from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from src.config.db import init_db
from src.routes.auth_routes import auth_bp
from src.routes.user_routes import user_bp
from src.middlewares.error_handlers import register_error_handlers

app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = "dev-secret"
jwt = JWTManager(app)

# Init DB
init_db(app)

# Register routes
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(user_bp, url_prefix="/users")

# Register global error handlers
register_error_handlers(app, jwt)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
