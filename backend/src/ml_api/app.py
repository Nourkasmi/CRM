import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import pandas as pd
import numpy as np
import joblib

# -------------------------------------------------------
# 🔹 Initialize Blueprint
# -------------------------------------------------------
ml_bp = Blueprint("ml_api", __name__)

# -------------------------------------------------------
# 🧠 Load ML Model, PCA, and Scaler
# -------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    model = joblib.load(os.path.join(BASE_DIR, "hr_cluster_model.pkl"))
    pca = joblib.load(os.path.join(BASE_DIR, "pca_transform.pkl"))
    scaler = joblib.load(os.path.join(BASE_DIR, "scaler.pkl"))
    print("✅ ML models loaded successfully (3-cluster model).")
except Exception as e:
    print(f"❌ Error loading ML models: {e}")

# -------------------------------------------------------
# 📁 File Upload Configuration
# -------------------------------------------------------
UPLOAD_FOLDER = os.path.join(os.path.dirname(BASE_DIR), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {"csv", "xlsx"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# -------------------------------------------------------
# 🔹 Upload CSV/XLSX → Predict + Dashboard metrics
# -------------------------------------------------------
@ml_bp.route("/upload", methods=["POST"])
def upload_and_predict():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file part"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No selected file"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "Unsupported file type"}), 400

        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # --- Load dataset ---
        if filename.endswith(".csv"):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)

        df = df.copy()

        # --- Encode object columns safely ---
        for col in df.columns:
            if df[col].dtype == "object":
                df[col] = df[col].replace({
                    "Yes": 1, "No": 0,
                    "Male": 1, "Female": 0,
                    "M": 1, "F": 0,
                    "Y": 1, "N": 0
                })
                df[col], _ = pd.factorize(df[col])

        # --- Match scaler input shape ---
        expected = scaler.mean_.shape[0]
        if df.shape[1] < expected:
            for i in range(expected - df.shape[1]):
                df[f"pad_{i}"] = 0
        elif df.shape[1] > expected:
            df = df.iloc[:, :expected]

        # --- Predict clusters ---
        X_scaled = scaler.transform(df.values)
        X_pca = pca.transform(X_scaled)
        clusters = model.predict(X_pca)
        df["Predicted_Cluster"] = clusters

        # --- Cluster counts ---
        cluster_counts = (
            pd.Series(clusters)
            .value_counts()
            .sort_index()
            .to_dict()
        )

        # --- Dataset summary ---
        dataset_summary = {
            "rows": int(df.shape[0]),
            "cols": int(df.shape[1]),
            "missing_pct": round(df.isnull().sum().sum() / (df.shape[0] * df.shape[1]), 4)
        }

        # --- Cluster KPIs (numeric feature averages per cluster) ---
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if "Predicted_Cluster" in numeric_cols:
            numeric_cols.remove("Predicted_Cluster")

        cluster_kpis = (
            df.groupby("Predicted_Cluster")[numeric_cols]
            .mean()
            .round(2)
            .to_dict(orient="index")
        )

        # --- Response ---
        return jsonify({
            "rows": df.head(10).to_dict(orient="records"),
            "cluster_summary": cluster_counts,
            "cluster_kpis": cluster_kpis,
            "dataset_summary": dataset_summary,
            "n_clusters": len(cluster_counts)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
