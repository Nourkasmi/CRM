from flask import jsonify

def register_error_handlers(app, jwt):
    """
    Register global error handlers for Flask + JWT.
    """

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"msg": "Not Found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"msg": "Internal Server Error"}), 500

    @jwt.unauthorized_loader
    def unauthorized_callback(err):
        return jsonify({"msg": "Missing or invalid token"}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"msg": "Token has expired"}), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({"msg": "Token has been revoked"}), 401
