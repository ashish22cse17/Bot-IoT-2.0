# ==========================================
# IoT IDS - Train DNN & CNN on Bot-IoT Dataset
# ==========================================

import pandas as pd
import numpy as np
import os
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)
from imblearn.over_sampling import SMOTE

import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping

# -----------------------------
# Load Dataset
# -----------------------------
DATA_PATH = "dataset/bot_iot.csv"
df = pd.read_csv(DATA_PATH)

df.columns = df.columns.str.strip()

print("Columns:", df.columns.tolist())
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

print(f"\nTotal Features: {len(feature_names)}")
print(f"Total Samples: {len(X)}")

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
for k, v in dataset_stats.items():
    print(f"{k}: {v}")

# -----------------------------
# Scaling
# -----------------------------
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_resampled)
X_test_scaled = scaler.transform(X_test)

# =====================================================
# 🟢 DEEP NEURAL NETWORK (DNN)
# =====================================================

print("\n" + "="*50)
print("Training DNN Model...")
print("="*50)

X_train_dnn = X_train_scaled
X_test_dnn = X_test_scaled

y_train_dnn = np.array(y_train_resampled)
y_test_dnn = np.array(y_test)

# Build DNN model

dnn_model = models.Sequential([
    layers.Input(shape=(X_train_dnn.shape[1],)),
    layers.Dense(128, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.3),
    layers.Dense(64, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.2),
    layers.Dense(32, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.2),
    layers.Dense(1, activation='sigmoid')
])

dnn_model.compile(
    optimizer=Adam(learning_rate=0.001),
    loss='binary_crossentropy',
    metrics=['accuracy']
)

print("\nDNN Model Architecture:")
dnn_model.summary()

early_stopping = EarlyStopping(
    monitor='val_loss',
    patience=5,
    restore_best_weights=True
)

history_dnn = dnn_model.fit(
    X_train_dnn,
    y_train_dnn,
    epochs=30,
    batch_size=32,
    validation_split=0.2,
    callbacks=[early_stopping],
    verbose=1
)

# Evaluate DNN

dnn_train_loss, dnn_train_acc = dnn_model.evaluate(X_train_dnn, y_train_dnn, verbose=0)
dnn_test_loss, dnn_test_acc = dnn_model.evaluate(X_test_dnn, y_test_dnn, verbose=0)

dnn_test_pred_prob = dnn_model.predict(X_test_dnn, verbose=0)
dnn_test_pred = (dnn_test_pred_prob > 0.5).astype(int).flatten()

dnn_cm = confusion_matrix(y_test_dnn, dnn_test_pred)
dnn_report = classification_report(y_test_dnn, dnn_test_pred, output_dict=True)

print("\n=== DNN Results ===")
print("Train Accuracy:", dnn_train_acc)
print("Test Accuracy:", dnn_test_acc)
print("Precision:", precision_score(y_test_dnn, dnn_test_pred))
print("Recall:", recall_score(y_test_dnn, dnn_test_pred))
print("F1-Score:", f1_score(y_test_dnn, dnn_test_pred))
print("Confusion Matrix:\n", dnn_cm)
print("\nClassification Report:\n", classification_report(y_test_dnn, dnn_test_pred))

dnn_metrics = {
    "train_accuracy": float(dnn_train_acc),
    "test_accuracy": float(dnn_test_acc),
    "precision": float(precision_score(y_test_dnn, dnn_test_pred)),
    "recall": float(recall_score(y_test_dnn, dnn_test_pred)),
    "f1_score": float(f1_score(y_test_dnn, dnn_test_pred)),
    "confusion_matrix": dnn_cm.tolist(),
    "classification_report": dnn_report
}

# =====================================================
# 🔵 CONVOLUTIONAL NEURAL NETWORK (CNN)
# =====================================================

print("\n" + "="*50)
print("Training CNN Model...")
print("="*50)

# Reshape data for CNN (treat as 1D convolution)
X_train_cnn = X_train_scaled.reshape(X_train_scaled.shape[0], X_train_scaled.shape[1], 1)
X_test_cnn = X_test_scaled.reshape(X_test_scaled.shape[0], X_test_scaled.shape[1], 1)

# Build CNN model
cnn_model = models.Sequential([
    layers.Conv1D(64, kernel_size=3, activation='relu', input_shape=(X_train_cnn.shape[1], 1)),
    layers.BatchNormalization(),
    layers.Conv1D(32, kernel_size=3, activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling1D(pool_size=2),
    layers.Dropout(0.3),
    
    layers.Conv1D(16, kernel_size=3, activation='relu'),
    layers.BatchNormalization(),
    layers.GlobalAveragePooling1D(),
    layers.Dropout(0.3),
    
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.2),
    layers.Dense(32, activation='relu'),
    layers.Dropout(0.2),
    layers.Dense(1, activation='sigmoid')
])

cnn_model.compile(
    optimizer=Adam(learning_rate=0.001),
    loss='binary_crossentropy',
    metrics=['accuracy']
)

print("\nCNN Model Architecture:")
cnn_model.summary()

history_cnn = cnn_model.fit(
    X_train_cnn,
    y_train_dnn,
    epochs=30,
    batch_size=32,
    validation_split=0.2,
    callbacks=[early_stopping],
    verbose=1
)

# Evaluate CNN
cnn_train_loss, cnn_train_acc = cnn_model.evaluate(X_train_cnn, y_train_dnn, verbose=0)
cnn_test_loss, cnn_test_acc = cnn_model.evaluate(X_test_cnn, y_test_dnn, verbose=0)

cnn_test_pred_prob = cnn_model.predict(X_test_cnn, verbose=0)
cnn_test_pred = (cnn_test_pred_prob > 0.5).astype(int).flatten()

cnn_cm = confusion_matrix(y_test_dnn, cnn_test_pred)
cnn_report = classification_report(y_test_dnn, cnn_test_pred, output_dict=True)

print("\n=== CNN Results ===")
print("Train Accuracy:", cnn_train_acc)
print("Test Accuracy:", cnn_test_acc)
print("Precision:", precision_score(y_test_dnn, cnn_test_pred))
print("Recall:", recall_score(y_test_dnn, cnn_test_pred))
print("F1-Score:", f1_score(y_test_dnn, cnn_test_pred))
print("Confusion Matrix:\n", cnn_cm)
print("\nClassification Report:\n", classification_report(y_test_dnn, cnn_test_pred))

cnn_metrics = {
    "train_accuracy": float(cnn_train_acc),
    "test_accuracy": float(cnn_test_acc),
    "precision": float(precision_score(y_test_dnn, cnn_test_pred)),
    "recall": float(recall_score(y_test_dnn, cnn_test_pred)),
    "f1_score": float(f1_score(y_test_dnn, cnn_test_pred)),
    "confusion_matrix": cnn_cm.tolist(),
    "classification_report": cnn_report
}

# =====================================================
# Save Models
# =====================================================

os.makedirs("models", exist_ok=True)

# Save DNN Model

dnn_package = {
    "model_path": "models/dnn_model.h5",
    "scaler": scaler,
    "metrics": dnn_metrics,
    "features": feature_names,
    "dataset_info": dataset_stats,
    "input_shape": X_train_dnn.shape[1:]
}

dnn_model.save("models/dnn_model.h5")
print("\n✅ DNN Model saved to models/dnn_model.h5")
joblib.dump(dnn_package, "models/dnn_package.pkl")
print("✅ DNN metadata saved to models/dnn_package.pkl")

# Save CNN Model
cnn_model.save("models/cnn_model.h5")
print("✅ CNN Model saved to models/cnn_model.h5")

# Save CNN Package metadata
cnn_package = {
    "model_path": "models/cnn_model.h5",
    "scaler": scaler,
    "metrics": cnn_metrics,
    "features": feature_names,
    "dataset_info": dataset_stats,
    "input_shape": X_train_cnn.shape[1:]
}
joblib.dump(cnn_package, "models/cnn_package.pkl")
print("✅ CNN metadata saved to models/cnn_package.pkl")

# =====================================================
# Model Comparison
# =====================================================
print("\n" + "="*60)
print("MODEL COMPARISON SUMMARY")
print("="*60)
print(f"{'Metric':<20} {'DNN':<15} {'CNN':<15}")
print("-"*60)
print(f"{'Train Accuracy':<20} {dnn_train_acc:<15.4f} {cnn_train_acc:<15.4f}")
print(f"{'Test Accuracy':<20} {dnn_test_acc:<15.4f} {cnn_test_acc:<15.4f}")
print(f"{'Precision':<20} {dnn_metrics['precision']:<15.4f} {cnn_metrics['precision']:<15.4f}")
print(f"{'Recall':<20} {dnn_metrics['recall']:<15.4f} {cnn_metrics['recall']:<15.4f}")
print(f"{'F1-Score':<20} {dnn_metrics['f1_score']:<15.4f} {cnn_metrics['f1_score']:<15.4f}")
print("="*60)

print("\n✅ Training Complete! Both models trained on bot_iot.csv")

print("\n✅ Training Complete! Both models trained on bot_iot.csv")
