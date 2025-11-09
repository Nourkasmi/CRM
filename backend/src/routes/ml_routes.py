from flask import Blueprint, request, jsonify
import requests

ml_bp = Blueprint("ml", __name__)

# The internal URL of your ML API (running separately on port 5050)
ML_API_URL = "http://127.0.0.1:5050/predict"

@ml_bp.route("/predict", methods=["POST"])
def predict_from_ml():
    """
    Forwards the frontend's data to the ML API for prediction
    and returns the result back to the frontend.
    """
    try:
        payload = request.get_json()
        if not payload or "features" not in payload:
            return jsonify({"error": "Invalid input format"}), 400

        # Forward the request to your model’s Flask API
        response = requests.post(ML_API_URL, json=payload)

        # Forward the model’s response directly back to the frontend
        return jsonify(response.json()), response.status_code

    except requests.exceptions.ConnectionError:
        return jsonify({"error": "ML API not reachable on port 5050"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500
