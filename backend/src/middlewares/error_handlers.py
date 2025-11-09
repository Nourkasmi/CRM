from flask import jsonify, make_response
from flask_jwt_extended.exceptions import JWTExtendedException

def register_error_handlers(app, jwt):
    """
    Register global error handlers for Flask + JWT with CORS support.
    """

    def corsify(response):
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    # 🔹 Catch generic 422 errors
    @app.errorhandler(422)
    def handle_unprocessable_entity(e):
        print("🚨 422 ERROR:", e)
        return corsify(make_response(jsonify({"error": str(e)}), 422))

    # 🔹 Catch JWT-specific exceptions
    @app.errorhandler(JWTExtendedException)
    def handle_jwt_extended_exception(e):
        print("🚨 JWT ERROR:", e)
        return corsify(make_response(jsonify({"error": str(e)}), 422))

    @app.errorhandler(404)
    def not_found(e):
        return corsify(make_response(jsonify({"msg": "Not Found"}), 404))

    @app.errorhandler(500)
    def server_error(e):
        return corsify(make_response(jsonify({"msg": "Internal Server Error"}), 500))

    @jwt.unauthorized_loader
    def unauthorized_callback(err):
        print("🚫 JWT Unauthorized:", err)
        return corsify(make_response(jsonify({"msg": "Missing or invalid token"}), 401))

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print("⏰ JWT Expired")
        return corsify(make_response(jsonify({"msg": "Token has expired"}), 401))

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        print("🔒 JWT Revoked")
        return corsify(make_response(jsonify({"msg": "Token has been revoked"}), 401))
