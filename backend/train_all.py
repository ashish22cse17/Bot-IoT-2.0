# ==========================================
# IoT IDS - Train RF & Linear SVM (SMOTE Balanced)
# ==========================================

import pandas as pd
import numpy as np
import os
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)
from imblearn.over_sampling import SMOTE

# -----------------------------
# Load Dataset
# -----------------------------
DATA_PATH = "dataset/datasvm.csv"
df = pd.read_csv(DATA_PATH)

df.columns = df.columns.str.strip()

print("Columns:", df.columns)
print("\nOriginal Class Distribution:")
print(df["attack"].value_counts())
print(df["attack"].value_counts(normalize=True) * 100)

# -----------------------------
# Clean Data
# -----------------------------
df.drop_duplicates(inplace=True)
df.dropna(inplace=True)

TARGET = "attack"

# Encode target if categorical
if df[TARGET].dtype == "object":
    le = LabelEncoder()
    df[TARGET] = le.fit_transform(df[TARGET])

# -----------------------------
# Feature Selection
# -----------------------------
X = df.drop([TARGET], axis=1)
X = X.select_dtypes(include=[np.number])

y = df[TARGET]
feature_names = X.columns.tolist()

# -----------------------------
# Train-Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nBefore SMOTE (Training set):")
print(y_train.value_counts())

# -----------------------------
# Apply SMOTE (ONLY TRAIN DATA)
# -----------------------------
sm = SMOTE(random_state=42)
X_train_resampled, y_train_resampled = sm.fit_resample(X_train, y_train)

print("\nAfter SMOTE (Training set):")
print(pd.Series(y_train_resampled).value_counts())


# -----------------------------
# Dataset Statistics
# -----------------------------
dataset_stats = {
    "total_samples": len(df),
    "total_features": X.shape[1],

    "train_samples_before_smote": len(X_train),
    "test_samples": len(X_test),

    "train_samples_after_smote": len(X_train_resampled),

    "train_class_distribution_before_smote": y_train.value_counts().to_dict(),
    "train_class_distribution_after_smote": pd.Series(y_train_resampled).value_counts().to_dict()
}

print("\nDataset Usage Summary:")
for k,v in dataset_stats.items():
    print(f"{k}: {v}")

# -----------------------------
# Scaling
# -----------------------------
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_resampled)
X_test_scaled = scaler.transform(X_test)

# =====================================================
# 🔵 RANDOM FOREST
# =====================================================

rf = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
)

rf.fit(X_train_scaled, y_train_resampled)

rf_train_acc = rf.score(X_train_scaled, y_train_resampled)
rf_test_pred = rf.predict(X_test_scaled)
rf_test_acc = accuracy_score(y_test, rf_test_pred)

rf_cm = confusion_matrix(y_test, rf_test_pred)
rf_report = classification_report(y_test, rf_test_pred, output_dict=True)

print("\n=== Random Forest Results ===")
print("Train Accuracy:", rf_train_acc)
print("Test Accuracy:", rf_test_acc)
print("Confusion Matrix:\n", rf_cm)
print("\nClassification Report:\n", classification_report(y_test, rf_test_pred))

rf_metrics = {
    "train_accuracy": rf_train_acc,
    "test_accuracy": rf_test_acc,
    "precision": precision_score(y_test, rf_test_pred),
    "recall": recall_score(y_test, rf_test_pred),
    "f1_score": f1_score(y_test, rf_test_pred),
    "confusion_matrix": rf_cm.tolist(),
    "classification_report": rf_report
}

# =====================================================
# 🔴 SVM (Kernel SVM)
# =====================================================

svm = SVC(
    kernel='rbf',      # most common kernel
    C=1.0,
    gamma='scale',
    probability=True,
    random_state=42
)

svm.fit(X_train_scaled, y_train_resampled)

svm_train_acc = svm.score(X_train_scaled, y_train_resampled)
svm_test_pred = svm.predict(X_test_scaled)
svm_test_acc = accuracy_score(y_test, svm_test_pred)

svm_cm = confusion_matrix(y_test, svm_test_pred)
svm_report = classification_report(y_test, svm_test_pred, output_dict=True)

print("\n=== SVM Results ===")
print("Train Accuracy:", svm_train_acc)
print("Test Accuracy:", svm_test_acc)
print("Confusion Matrix:\n", svm_cm)
print("\nClassification Report:\n", classification_report(y_test, svm_test_pred))

svm_metrics = {
    "train_accuracy": svm_train_acc,
    "test_accuracy": svm_test_acc,
    "precision": precision_score(y_test, svm_test_pred),
    "recall": recall_score(y_test, svm_test_pred),
    "f1_score": f1_score(y_test, svm_test_pred),
    "confusion_matrix": svm_cm.tolist(),
    "classification_report": svm_report
}
# =====================================================
# Save Models
# =====================================================

os.makedirs("models", exist_ok=True)

rf_package = {
    "model": rf,
    "scaler": scaler,
    "metrics": rf_metrics,
    "features": feature_names,
    "dataset_info": dataset_stats
}
svm_package = {
    "model": svm,
    "scaler": scaler,
    "metrics": svm_metrics,
    "features": feature_names,
    "dataset_info": dataset_stats
}

joblib.dump(rf_package, "models/rf_model.pkl")
joblib.dump(svm_package, "models/svm_model.pkl")

print("\n✅ Training Complete (SMOTE Balanced & Fully Evaluated)")