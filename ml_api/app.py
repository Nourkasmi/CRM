from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

# -----------------------------------------------------
# Initialize Flask app
# -----------------------------------------------------
app = Flask(__name__)
CORS(app)

# -----------------------------------------------------
# Load the saved model, PCA, and scaler
# -----------------------------------------------------
try:
    model = joblib.load("hr_cluster_model.pkl")
    pca = joblib.load("pca_transform.pkl")
    scaler = joblib.load("scaler.pkl")
    print("✅ Models loaded successfully.")
except Exception as e:
    print(f"❌ Error loading models: {e}")

# -----------------------------------------------------
# Define /predict endpoint
# -----------------------------------------------------
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No input data provided"}), 400

        # Convert incoming JSON to a numpy array
        X_input = np.array(data["features"]).reshape(1, -1)

        # Apply scaling and PCA
        X_scaled = scaler.transform(X_input)
        X_pca = pca.transform(X_scaled)

        # Make prediction
        cluster = model.predict(X_pca)[0]

        return jsonify({
            "cluster": int(cluster),
            "message": f"Employee belongs to cluster {int(cluster)}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------------------------------------
# Run server
# -----------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)
