"""
Unified Flask backend for IDS project.

Endpoints:
- /health
- /models
- /models/<name>/metrics
- /models/<name>/features
- /models/<name>/dataset
- /predict
- /upload
"""

import os
import io
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tensorflow as tf

# ==========================================
# App Config
# ==========================================
app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

MODEL_FILES = {
    "rf": os.path.join(MODEL_DIR, "rf_model.pkl"),
    "svm": os.path.join(MODEL_DIR, "svm_model.pkl"),
    "dnn": os.path.join(MODEL_DIR, "dnn_package.pkl"),
    "cnn": os.path.join(MODEL_DIR, "cnn_package.pkl")
}

# ==========================================
# Helper Function
# ==========================================
def load_model_package(name):

    if name not in MODEL_FILES:
        raise ValueError("Invalid model name")

    path = MODEL_FILES[name]

    if not os.path.exists(path):
        raise RuntimeError(f"Model file not found: {path}")

    package = joblib.load(path)
    model_path = package.get("model_path")

    if model_path:
        if not os.path.exists(model_path):
            raise RuntimeError(f"Model file not found: {model_path}")
        model = tf.keras.models.load_model(model_path)
        return {
            "model": model,
            "scaler": package.get("scaler"),
            "metrics": package.get("metrics"),
            "features": package.get("features"),
            "dataset_info": package.get("dataset_info"),
            "is_keras": True,
            "is_cnn": name == "cnn",
            "input_shape": package.get("input_shape")
        }

    return {
        "model": package.get("model"),
        "scaler": package.get("scaler"),
        "metrics": package.get("metrics"),
        "features": package.get("features"),
        "dataset_info": package.get("dataset_info"),
        "is_keras": False,
        "is_cnn": False
    }


# ==========================================
# Health Check
# ==========================================
@app.route("/health")
def health():
    return jsonify({"status": "ok"})


# ==========================================
# List Models
# ==========================================
@app.route("/models")
def models():

    result = {}

    for name, path in MODEL_FILES.items():

        available = os.path.exists(path)

        metrics = None
        dataset_info = None

        if available:
            try:
                pkg = joblib.load(path)
                metrics = pkg.get("metrics")
                dataset_info = pkg.get("dataset_info")
            except:
                pass

        result[name] = {
            "available": available,
            "metrics": metrics,
            "dataset_info": dataset_info
        }

    return jsonify(result)


# ==========================================
# Get Model Features
# ==========================================
@app.route("/models/<name>/features")
def get_features(name):

    try:
        data = load_model_package(name)
        return jsonify({"features": data["features"]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# Get Model Metrics
# ==========================================
@app.route("/models/<name>/metrics")
def get_metrics(name):

    try:
        data = load_model_package(name)
        return jsonify(data["metrics"])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# Get Dataset Info
# ==========================================
@app.route("/models/<name>/dataset")
def get_dataset(name):

    try:
        data = load_model_package(name)
        return jsonify(data.get("dataset_info", {}))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# Single Prediction
# ==========================================
@app.route("/predict", methods=["POST"])
def predict():

    payload = request.get_json() or {}
    model_name = payload.get("model")

    if model_name not in MODEL_FILES:
        return jsonify({"error": "Invalid or missing model name"}), 400

    try:
        data = load_model_package(model_name)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    model = data["model"]
    scaler = data["scaler"]
    features = data["features"]
    is_keras = data.get("is_keras", False)
    is_cnn = data.get("is_cnn", False)

    try:

        x = np.array([float(payload.get(f, 0)) for f in features]).reshape(1, -1)

        x = scaler.transform(x)

    except Exception:

        return jsonify({"error": "Invalid feature values"}), 400

    if is_keras:
        if is_cnn:
            x = x.reshape(x.shape[0], x.shape[1], 1)
        pred_prob = model.predict(x, verbose=0)[0][0]
        prediction = int(1 if pred_prob > 0.5 else 0)
        confidence = float(max(pred_prob, 1 - pred_prob) * 100)
        probabilities = [float(1 - pred_prob), float(pred_prob)]
    else:
        prediction = int(model.predict(x)[0])
        probabilities = None
        confidence = None

        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(x)[0]
            probabilities = probs.tolist()
            confidence = float(np.max(probs) * 100)

    return jsonify({

        "prediction": prediction,
        "probabilities": probabilities,
        "confidence": confidence,
        "features_used": features

    })


# ==========================================
# CSV Upload Prediction
# ==========================================
@app.route("/upload", methods=["POST"])
def upload():

    model_name = request.form.get("model")

    if model_name not in MODEL_FILES:
        return jsonify({"error": "Provide a valid model name"}), 400

    try:
        data = load_model_package(model_name)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    try:
        df = pd.read_csv(file)
    except Exception as e:
        return jsonify({"error": f"Failed to read CSV: {str(e)}"}), 400

    features = data["features"]
    model = data["model"]
    scaler = data["scaler"]
    is_cnn = data.get("is_cnn", False)

    # Add missing columns
    for col in features:
        if col not in df.columns:
            df[col] = 0

    # Convert to numeric
    for col in features:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    if df[features].isna().any().any():
        return jsonify({"error": "Feature columns contain invalid values"}), 400

    try:

        X = df[features].values
        X = scaler.transform(X)

    except Exception as e:

        return jsonify({"error": f"Scaling failed: {str(e)}"}), 500

    # Handle CNN predictions differently
    if is_cnn:
        X_cnn = X.reshape(X.shape[0], X.shape[1], 1)
        pred_probs = model.predict(X_cnn, verbose=0)
        predictions = (pred_probs > 0.5).astype(int).flatten()
        df["confidence"] = np.max(np.hstack([1 - pred_probs, pred_probs]), axis=1) * 100
    else:
        predictions = model.predict(X)
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(X)
            df["confidence"] = np.max(probabilities, axis=1) * 100

    df["prediction"] = predictions.astype(int)

    output = io.StringIO()

    df.to_csv(output, index=False)

    output.seek(0)

    return send_file(

        io.BytesIO(output.getvalue().encode()),
        mimetype="text/csv",
        as_attachment=True,
        download_name="predictions.csv"

    )


# ==========================================
# Run Server
# ==========================================
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5020)