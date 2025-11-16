from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import joblib
import numpy as np

ml_bp = Blueprint("ml", __name__)

# Load models once
model = joblib.load("src/ml_api/hr_cluster_model.pkl")
pca = joblib.load("src/ml_api/pca_transform.pkl")
scaler = joblib.load("src/ml_api/scaler.pkl")

@ml_bp.route("/hr-cluster", methods=["POST"])
@jwt_required()
def predict_cluster():
    try:
        data = request.get_json()
        if not data or "features" not in data:
            return jsonify({"error": "Missing 'features' key"}), 400

        X_input = np.array(data["features"]).reshape(1, -1)
        X_scaled = scaler.transform(X_input)
        X_pca = pca.transform(X_scaled)
        cluster = model.predict(X_pca)[0]

        return jsonify({
            "cluster": int(cluster),
            "message": f"Employee belongs to cluster {int(cluster)}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
