from flask import jsonify, make_response

def register_error_handlers(app, jwt):
    """
    Register global error handlers for Flask + JWT with CORS support.
    """

    def corsify(response):
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    @app.errorhandler(404)
    def not_found(e):
        return corsify(make_response(jsonify({"msg": "Not Found"}), 404))

    @app.errorhandler(500)
    def server_error(e):
        return corsify(make_response(jsonify({"msg": "Internal Server Error"}), 500))

    @jwt.unauthorized_loader
    def unauthorized_callback(err):
        return corsify(make_response(jsonify({"msg": "Missing or invalid token"}), 401))

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return corsify(make_response(jsonify({"msg": "Token has expired"}), 401))

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return corsify(make_response(jsonify({"msg": "Token has been revoked"}), 401))
