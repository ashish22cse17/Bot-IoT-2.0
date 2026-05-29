# IoT Intrusion Detection System (IDS) — Multi-Model AI Platform

## 📋 Project Overview

This project implements an **Internet of Things (IoT) Intrusion Detection System** using a hybrid machine learning and deep learning approach. The system combines classical machine learning models with modern deep neural networks to detect and classify network anomalies and cyber attacks in IoT environments.

**Key Highlights:**
- 🔍 **Two-Phase Detection Architecture**: Phase 1 (Classical ML) + Phase 2 (Deep Learning)
- 📊 **4 Integrated Models**: Random Forest, Linear SVM, DNN, CNN
- 🚀 **Web-Based Dashboard**: Real-time predictions and model comparisons
- 📱 **Cross-Platform**: Web frontend (React/TypeScript) + Flask backend
- 🎯 **High Accuracy**: Comprehensive evaluation metrics (Accuracy, Precision, Recall, F1-Score)

---

## 🏗️ Project Architecture

```
IoT IDS
├── Backend (Flask API)
│   ├── Preprocessing Pipeline (preprocess.py)
│   ├── Phase 1 - Classical ML Training (train_ml.py)
│   ├── Phase 2 - Deep Learning Training (train_dl.py)
│   ├── Model Inference API (app.py)
│   └── Trained Models (model/)
│
└── Frontend (React + TypeScript)
    ├── Dashboard
    ├── Model Comparison UI
    ├── Real-time Predictions
    └── Visualization Components
```

---

## 📦 System Requirements

### Backend Requirements
- **Python**: 3.8+
- **TensorFlow**: 2.10+
- **scikit-learn**: 1.0+
- **Flask**: 2.0+
- **Pandas/NumPy**: Latest

### Frontend Requirements
- **Node.js**: 16+
- **React**: 18+
- **TypeScript**: 5.0+
- **Vite**: 4.0+

### Hardware Recommendations
- **CPU**: Intel i5/i7 or AMD Ryzen 5/7
- **RAM**: 8GB minimum (16GB recommended)
- **GPU**: NVIDIA CUDA-capable (optional, for faster training)

---

## 🔧 Installation & Setup

### Step 1: Clone and Navigate
```bash
cd d:\project\final
```

### Step 2: Backend Setup

#### 2.1 Create Python Environment
```bash
cd Backend
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate
```

#### 2.2 Install Dependencies
```bash
pip install -r requirements.txt
```

**Dependencies:**
- `flask` - Web framework
- `flask-cors` - Enable cross-origin requests
- `scikit-learn` - ML algorithms
- `tensorflow` - Deep learning framework
- `pandas` - Data manipulation
- `numpy` - Numerical computing
- `joblib` - Model serialization
- `gunicorn` - Production server

### Step 3: Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📊 Dataset Details

### Dataset Source
- **Name**: Bot-IoT Dataset
- **Type**: Network Traffic Classification
- **Format**: CSV (comma-separated values)
- **Expected Location**: `Backend/dataset/dataset.csv` or `Backend/dataset/sample.csv`

### Data Characteristics
- **Original Format**: Network flow data with behavior features
- **Records**: Thousands of IoT network packets
- **Classes**: Multi-class attack classification
  - Legitimate traffic
  - DDoS attacks
  - Reconnaissance attacks
  - Theft attacks
  - Blackhole attacks

### Feature Categories

#### 1. **Temporal Features**
- Flow duration
- Packet inter-arrival times
- Connection duration

#### 2. **Statistical Features**
- Source/destination IP statistics
- Port-based features
- Protocol distribution

#### 3. **Network Flow Features**
- Packet sizes and counts
- Byte totals and rates
- Protocol ratios

#### 4. **Behavioral Features**
- Connection patterns
- Sequential packet analysis
- Anomaly indicators

---

## 🔄 Data Preprocessing Pipeline

### Overview
Raw network data undergoes systematic cleaning before model training.

### Preprocessing Steps

**Location**: `Backend/preprocess.py`

#### Step 1: Data Loading
```python
- Load CSV from dataset/ directory
- Detect label column automatically
- Handle multiple CSV formats
```

#### Step 2: Duplicate Removal
```python
- Remove exact duplicate rows
- Preserve original features
- Report removal count
```

#### Step 3: Missing Value Handling
```python
- Replace infinity values with NaN
- Drop columns with >50% missing values
- Apply mean imputation to remaining NaN
```

#### Step 4: Feature Engineering
```python
- Drop zero-variance columns
- Remove highly correlated features (>0.98)
- Cap outliers at 1st-99th percentile
```

#### Step 5: Label Encoding
```python
- Convert categorical labels to numeric
- Create label mapping dictionary
- Balance class distribution awareness
```

#### Step 6: Output
```
Backend/dataset/
├── clean_dataset.pkl          ← Preprocessed features & labels
└── clean_dataset_info.json    ← Preprocessing metadata
```

### Running Preprocessing
```bash
cd Backend
python preprocess.py
```

**Output:**
```
=====================================
PREPROCESSING PIPELINE
=====================================
Original shape         : (N, M)
Duplicates removed     : X
Inf values → NaN       : done
Columns dropped (>50% NaN): Y
Remaining NaN filled   : mean imputation
Zero-variance cols dropped: Z
Highly corr cols dropped: W
Outliers capped        : 1st-99th percentile
Label encoding         : {'Normal': 0, 'Attack1': 1, ...}

Final shape            : X=(N', M')
Features kept          : M'
Classes                : [Normal, Attack1, Attack2, ...]
```

---

## 🤖 Phase 1: Classical Machine Learning Models

### Overview
Phase 1 uses traditional ML algorithms optimized for quick, interpretable predictions.

**Run Command:**
```bash
cd Backend
python train_ml.py
```

### Model 1: Random Forest (RF)

#### Architecture
- **Type**: Ensemble learning
- **Trees**: 200 decision trees
- **Max Depth**: Unlimited (automatic pruning)
- **Min Samples Split**: 2
- **Class Weighting**: Balanced (handles imbalanced datasets)

#### Algorithm Characteristics
```
Random Forest
├── Multiple decision trees trained on random subsets
├── Bagging technique for variance reduction
├── Feature importance based on splitting
└── Prediction = Majority vote across all trees
```

#### Training Details
```python
X_train : 80% of clean data
X_test  : 20% held out for evaluation
Random State: 42 (reproducibility)
Stratified Split: Maintains class distribution
```

#### Model Parameters
```python
RandomForestClassifier(
    n_estimators=200,       # Number of trees
    max_depth=None,         # Full tree growth
    min_samples_split=2,    # Minimum samples to split
    random_state=42,        # Reproducibility
    class_weight='balanced',# Handle class imbalance
    n_jobs=-1              # Use all CPU cores
)
```

#### Expected Accuracy Range
- **Accuracy**: 92-96%
- **Precision**: 91-95%
- **Recall**: 92-96%
- **F1-Score**: 92-95%

#### Advantages
✅ Fast training (seconds)
✅ No feature scaling needed
✅ Feature importance rankings
✅ Handles non-linear relationships
✅ Robust to outliers

#### Disadvantages
❌ Slower inference on large batches
❌ Large model size
❌ Less interpretable than simple trees

#### Output Files
```
Backend/model/
├── rf_model.pkl          ← Trained model
├── features_rf.pkl       ← Feature names
└── metrics_rf.pkl        ← Performance metrics
```

---

### Model 2: Linear Support Vector Machine (SVM)

#### Architecture
- **Type**: Supervised learning classifier
- **Kernel**: Linear
- **Regularization**: C=1.0
- **Max Iterations**: 15,000
- **Loss**: Squared Hinge Loss

#### Algorithm Characteristics
```
Linear SVM
├── Finds optimal hyperplane for classification
├── Maximizes margin between classes
├── Handles high-dimensional data well
└── Prediction = Sign of decision function
```

#### Preprocessing
Linear SVM requires feature scaling due to distance-based calculations:
```python
# Missing value imputation
Imputer = SimpleImputer(strategy='mean')
X_imputed = Imputer.fit_transform(X)

# Feature standardization (CRITICAL)
Scaler = StandardScaler()
X_scaled = Scaler.fit_transform(X_imputed)
```

#### Training Details
```python
X_train_scaled : 80% of normalized data
X_test_scaled  : 20% held out
Scaling: Zero mean, unit variance
Stratified Split: Maintains class balance
```

#### Model Parameters
```python
LinearSVC(
    C=1.0,                  # Regularization strength
    max_iter=15000,         # Maximum iterations
    random_state=42,        # Reproducibility
    class_weight='balanced' # Handle class imbalance
)
```

#### Expected Accuracy Range
- **Accuracy**: 89-94%
- **Precision**: 88-93%
- **Recall**: 89-94%
- **F1-Score**: 88-93%

#### Advantages
✅ Fast training and inference
✅ Memory efficient
✅ Good with high-dimensional data
✅ Clear decision boundary
✅ Effective for binary and multi-class

#### Disadvantages
❌ Requires feature scaling
❌ Sensitive to feature outliers
❌ Less accurate on non-linearly separable data
❌ Less interpretable than trees

#### Output Files
```
Backend/model/
├── linear_svm_model.pkl   ← Trained SVM
├── scaler_svm.pkl         ← Feature scaler
├── imputer_svm.pkl        ← Imputation strategy
├── features_svm.pkl       ← Feature names
└── metrics_svm.pkl        ← Performance metrics
```

---

### Phase 1 Comparison Table

| Metric | Random Forest | Linear SVM |
|--------|---------------|-----------|
| Training Speed | Fast (seconds) | Fast (seconds) |
| Inference Speed | Moderate | Very Fast |
| Accuracy | 92-96% | 89-94% |
| Feature Scaling | Not required | Required |
| Interpretability | High (feature importance) | Moderate |
| Model Size | Large (~10-50 MB) | Small (~1-5 MB) |
| Outlier Robustness | High | Low |

---

## 🧠 Phase 2: Deep Learning Models

### Overview
Phase 2 uses neural networks for superior pattern recognition and automatic feature learning.

**Run Command:**
```bash
cd Backend
python train_dl.py
```

### Data Split for Deep Learning
```
Total Clean Data (100%)
├── Training Set (70%)  ← Model learning
├── Validation Set (15%) ← Hyperparameter tuning
└── Test Set (15%)      ← Final evaluation
```

### Common Preprocessing for Deep Learning
```python
# Missing value safety net
Imputer = SimpleImputer(strategy='mean')
X = Imputer.fit_transform(X)

# Normalization (CRITICAL for neural networks)
Scaler = StandardScaler()
X = Scaler.fit_transform(X)
```

---

### Model 3: Deep Neural Network (DNN)

#### Architecture
```
Input Layer (Features)
    ↓
Dense: 256 neurons
  ├── L2 Regularization (1e-4)
  ├── Batch Normalization
  ├── ReLU Activation
  └── Dropout (0.3)
    ↓
Dense: 128 neurons
  ├── L2 Regularization (1e-4)
  ├── Batch Normalization
  ├── ReLU Activation
  └── Dropout (0.3)
    ↓
Dense: 64 neurons
  ├── L2 Regularization (1e-4)
  ├── Batch Normalization
  ├── ReLU Activation
  └── Dropout (0.2)
    ↓
Dense: 32 neurons
  ├── L2 Regularization (1e-4)
  ├── Batch Normalization
  ├── ReLU Activation
  └── Dropout (0.2)
    ↓
Output Layer
  └── Softmax Activation (multi-class)
```

#### Key Components

**1. Dense Layers**
- Fully connected layers
- Learn complex feature combinations
- Sizes: 256 → 128 → 64 → 32 → Output

**2. Batch Normalization**
- Normalizes activations between layers
- Stabilizes training
- Reduces internal covariate shift

**3. Regularization**
- L2 Regularization (weight decay, λ=1e-4)
- Prevents overfitting by penalizing large weights
- Encourages simpler, more generalizable models

**4. Dropout**
- Randomly disables 20-30% of neurons during training
- Reduces co-adaptation
- Improves generalization

**5. Activation Functions**
- ReLU (hidden layers): max(0, x) - non-linear, efficient
- Softmax (output): Probability distribution over classes

#### Training Configuration
```python
Optimizer: Adam
  ├── Learning Rate: 1e-3
  ├── Adaptive momentum
  └── Works well with normalization

Loss Function: Sparse Categorical Crossentropy
  ├── For multi-class classification
  ├── Expects integer labels
  └── Penalizes incorrect predictions

Batch Size: 512
  ├── Larger batches = more stable gradients
  ├── Faster per-batch computation
  └── Lower GPU memory requirement

Epochs: 100 (with early stopping)
  ├── Early stopping patience: 10 epochs
  ├── Restores best weights
  └── Stops if no validation improvement
```

#### Callbacks
```python
1. EarlyStopping
   ├── Monitors: val_loss
   ├── Patience: 10 epochs
   └── Restores best model weights

2. ReduceLROnPlateau
   ├── Monitors: val_loss
   ├── Factor: 0.5 (reduce by half)
   ├── Patience: 5 epochs
   └── Min LR: 1e-6

3. ModelCheckpoint
   ├── Saves best model (by val_accuracy)
   ├── Checkpoint: dnn_checkpoint.keras
   └── Automatic restoration
```

#### Expected Accuracy Range
- **Accuracy**: 94-97%
- **Precision**: 93-96%
- **Recall**: 94-97%
- **F1-Score**: 93-96%

#### Advantages
✅ Learns complex non-linear patterns
✅ Automatic feature learning
✅ High accuracy potential
✅ Works with large datasets
✅ Flexible architecture

#### Disadvantages
❌ Requires more data for training
❌ Slower inference than classical ML
❌ More hyperparameters to tune
❌ Black-box nature (less interpretable)
❌ Requires feature scaling

#### Output Files
```
Backend/model/
├── dnn_model.keras       ← Full Keras model
├── dnn_model.tflite      ← Optimized TensorFlow Lite
├── scaler_dnn.pkl        ← Feature scaler
├── imputer_dnn.pkl       ← Imputation strategy
├── features_dnn.pkl      ← Feature names
├── dnn_checkpoint.keras  ← Best checkpoint
└── metrics_dnn.pkl       ← Performance metrics
```

---

### Model 4: Convolutional Neural Network (CNN)

#### Architecture
```
Input Layer: (Features, 1)
  └── Reshape for Conv1D
    ↓
Convolutional Block 1
  ├── Conv1D: 64 filters, kernel=3
  ├── Batch Normalization
  ├── Conv1D: 64 filters, kernel=3
  ├── Batch Normalization
  ├── MaxPooling1D: pool_size=2
  └── Dropout (0.3)
    ↓
Convolutional Block 2
  ├── Conv1D: 128 filters, kernel=3
  ├── Batch Normalization
  ├── Conv1D: 128 filters, kernel=3
  ├── Batch Normalization
  ├── GlobalAveragePooling1D
  └── Dropout (0.3)
    ↓
Dense Head
  ├── Dense: 64 neurons
  ├── ReLU Activation
  ├── L2 Regularization (1e-4)
  └── Dropout (0.2)
    ↓
Output Layer
  └── Softmax Activation
```

#### Why CNN for Network Data?

**1. Spatial Feature Detection**
- Conv1D kernels detect local patterns
- Similar to feature subsequences in traffic
- Learns hierarchical feature combinations

**2. Dimensionality Reduction**
- Pooling reduces feature space
- Focuses on important patterns
- Reduces overfitting

**3. Parameter Efficiency**
- Shared weights across positions
- Fewer parameters than fully connected
- Better generalization on smaller datasets

#### Conv1D Operations
```
Input Shape: (batch_size, sequence_length, channels)
           = (512, num_features, 1)

Conv1D Filter: (kernel_size, input_channels, output_channels)
             = (3, 1, 64)

Output: Convolved features
        (512, num_features, 64)
```

#### Pooling Explanation
```
MaxPooling1D(pool_size=2)
├── Reduces dimensions by factor of 2
├── Keeps maximum value in each window
├── Reduces computation
└── Makes model more robust to small shifts
```

#### GlobalAveragePooling1D
```
Input:  (batch, sequence_length, channels)
        ↓
Average across sequence dimension
        ↓
Output: (batch, channels)

Benefits:
├── Eliminates spatial dimensions
├── Reduces parameters in FC layers
├── More stable than flattening
└── Less prone to overfitting
```

#### Training Configuration
```python
Same as DNN:
├── Optimizer: Adam (lr=1e-3)
├── Loss: Sparse Categorical Crossentropy
├── Batch Size: 512
├── Epochs: 100 (with early stopping)
└── Callbacks: Early stopping, LR reduction, checkpointing
```

#### Expected Accuracy Range
- **Accuracy**: 95-98%
- **Precision**: 94-97%
- **Recall**: 95-98%
- **F1-Score**: 94-97%

#### Advantages
✅ Highest accuracy potential
✅ Excellent pattern recognition
✅ Efficient parameter usage
✅ Handles sequential patterns well
✅ Robust feature extraction

#### Disadvantages
❌ More complex architecture
❌ Requires larger datasets for optimal performance
❌ Slower training than DNN
❌ Requires feature scaling
❌ Harder to interpret decisions

#### Output Files
```
Backend/model/
├── cnn_model.keras       ← Full Keras model
├── cnn_model.tflite      ← Optimized TensorFlow Lite
├── scaler_cnn.pkl        ← Feature scaler
├── imputer_cnn.pkl       ← Imputation strategy
├── features_cnn.pkl      ← Feature names
├── cnn_checkpoint.keras  ← Best checkpoint
└── metrics_cnn.pkl       ← Performance metrics
```

---

### Phase 2 Comparison Table

| Metric | DNN | CNN |
|--------|-----|-----|
| Training Speed | Moderate | Moderate-Slow |
| Inference Speed | Moderate | Moderate |
| Accuracy | 94-97% | 95-98% |
| Feature Learning | Yes | Yes (hierarchical) |
| Model Size | Medium (~5-20 MB) | Medium (~5-20 MB) |
| Pattern Detection | General | Local/Sequential |
| Interpretability | Very Low | Very Low |
| Generalization | Good | Excellent |

---

## 📈 Accuracy Metrics Details

### Metrics Computed for All Models

#### 1. Accuracy
```
Formula: (TP + TN) / (TP + TN + FP + FN)

Definition:
- Overall correctness
- Percentage of correct predictions
- Good for balanced datasets

Range: 0% - 100%
Best: 100% (perfect predictions)
```

#### 2. Precision (Per-Class, Weighted Average)
```
Formula: TP / (TP + FP)

Definition:
- Of all positive predictions, how many were correct?
- Minimizes false positives
- Important for reducing false alarms

Use Case:
- When cost of false positive is high
- Example: False alarm attacks (operational burden)

Range: 0% - 100%
Best: 100% (no false positives)
```

#### 3. Recall (Per-Class, Weighted Average)
```
Formula: TP / (TP + FN)

Definition:
- Of all actual positives, how many were found?
- Minimizes false negatives
- Important for catching all attacks

Use Case:
- When cost of false negative is high
- Example: Missing actual attacks (security risk)

Range: 0% - 100%
Best: 100% (no false negatives)
```

#### 4. F1-Score (Harmonic Mean)
```
Formula: 2 × (Precision × Recall) / (Precision + Recall)

Definition:
- Balanced metric combining precision & recall
- Single score for model comparison
- Ideal when precision-recall trade-off is unclear

Properties:
- Penalizes extreme imbalances
- 0-100% range
- Best: 100% (perfect precision & recall)

Interpretation:
- High F1 = Model handles both FP and FN well
- Best overall measure for most applications
```

#### 5. Confusion Matrix
```
                Predicted
               Positive  Negative
Actual
Positive    |    TP   |    FN   |  ← Recall = TP/(TP+FN)
Negative    |    FP   |    TN   |

Precision = TP/(TP+FP) ↑

TP = True Positives   (correct attack detection)
TN = True Negatives   (correct benign detection)
FP = False Positives  (benign classified as attack)
FN = False Negatives  (attack missed as benign)
```

### Expected Accuracy Summary

| Model | Accuracy | Precision | Recall | F1-Score | Test Size |
|-------|----------|-----------|--------|----------|-----------|
| **Random Forest** | 92-96% | 91-95% | 92-96% | 92-95% | 20% |
| **Linear SVM** | 89-94% | 88-93% | 89-94% | 88-93% | 20% |
| **DNN** | 94-97% | 93-96% | 94-97% | 93-96% | 15% |
| **CNN** | 95-98% | 94-97% | 95-98% | 94-97% | 15% |

---

## 🚀 Model Generation & Training Workflow

### Complete Training Pipeline

```
1. PREPARE
   └── Acquire Bot-IoT dataset
       └── Place in Backend/dataset/

2. PREPROCESS (preprocess.py)
   └── Load CSV
   ├── Clean duplicates & missing values
   ├── Feature engineering
   ├── Label encoding
   └── Output: clean_dataset.pkl

3. TRAIN PHASE 1 (train_ml.py)
   ├── Load clean_dataset.pkl
   ├── Train Random Forest
   │  ├── X_train: 80%
   │  ├── X_test: 20%
   │  └── Compute metrics
   │
   └── Train Linear SVM
      ├── Scale features
      ├── X_train: 80%
      ├── X_test: 20%
      └── Compute metrics

4. TRAIN PHASE 2 (train_dl.py)
   ├── Load clean_dataset.pkl
   ├── Split: Train 70%, Val 15%, Test 15%
   │
   ├── Train DNN
   │  ├── Build 4-layer network
   │  ├── Train for up to 100 epochs
   │  ├── Early stopping on validation loss
   │  ├── Save Keras model + TFLite
   │  └── Compute metrics
   │
   └── Train CNN
      ├── Build Conv + Dense network
      ├── Train for up to 100 epochs
      ├── Early stopping on validation loss
      ├── Save Keras model + TFLite
      └── Compute metrics

5. EVALUATE
   └── Compare all 4 models
       ├── Accuracy comparison
       ├── Speed vs accuracy trade-off
       ├── Resource requirements
       └── Choose best model for deployment

6. DEPLOY
   └── Start Flask API (app.py)
       ├── Load all 4 models
       ├── Serve predictions
       ├── Display metrics
       └── Compare models
```

### Step-by-Step Execution

#### Phase 1: Execute Preprocessing
```bash
cd Backend
python preprocess.py
```

**Expected Output:**
```
LoadingDataset: dataset/dataset.csv
Shape: (N, M)

============================================================
PREPROCESSING PIPELINE
============================================================
Original shape         : (N, M)
Duplicates removed     : X
Inf values → NaN       : done
Columns dropped (>50% NaN): Y
Remaining NaN filled   : mean imputation on Z cols
Zero-variance cols dropped: W
Highly corr cols dropped: V

Final shape            : (N', M')
Features kept          : M'
Classes                : [Normal, Attack1, ...]

Clean dataset saved → dataset/clean_dataset.pkl
Info saved            → dataset/clean_dataset_info.json
```

#### Phase 2: Train ML Models
```bash
python train_ml.py
```

**Expected Output:**
```
============================================================
IoT IDS — ML Training (RF + SVM)
============================================================

==================================================
TRAINING — Random Forest
==================================================
Accuracy  : 94.23%
Precision : 93.87%
Recall    : 94.18%
F1-Score  : 94.01%

RF model saved → model/rf_model.pkl

==================================================
TRAINING — Linear SVM
==================================================
Accuracy  : 91.56%
Precision : 91.23%
Recall    : 91.48%
F1-Score  : 91.34%

SVM model saved → model/linear_svm_model.pkl

============================================================
ML TRAINING COMPLETE — Summary:
Random Forest Accuracy : 94.23%
Linear SVM Accuracy    : 91.56%
Models saved in        : model/
============================================================

Next step → run: python train_dl.py
```

#### Phase 3: Train Deep Learning Models
```bash
python train_dl.py
```

**Expected Output:**
```
TensorFlow: 2.10.0
GPU: /physical_device:GPU:0 (or CPU mode)

Loaded clean dataset: X=(N', M'), classes=5

============================================================
TRAINING — Deep Neural Network (DNN)
============================================================
Model: Sequential
...
Epoch 1/100
Loss: 0.4521 | Val Loss: 0.3821 | Acc: 87.2% | Val Acc: 89.3%
...
Epoch 45/100 (Early stopping triggered)
Loss: 0.1234 | Val Loss: 0.1456 | Acc: 96.8% | Val Acc: 95.2%

Accuracy  : 96.45%
Precision : 96.12%
Recall    : 96.39%
F1-Score  : 96.24%

DNN saved → model/dnn_model.keras
TFLite saved → model/dnn_model.tflite (2,345 KB)

============================================================
TRAINING — 1D Convolutional Neural Network (CNN)
============================================================
Model: Functional
...
Epoch 1/100
Loss: 0.4123 | Val Loss: 0.3562 | Acc: 88.9% | Val Acc: 91.2%
...
Epoch 52/100 (Early stopping triggered)
Loss: 0.0876 | Val Loss: 0.1134 | Acc: 97.8% | Val Acc: 97.1%

Accuracy  : 97.23%
Precision : 97.01%
Recall    : 97.18%
F1-Score  : 97.09%

CNN saved → model/cnn_model.keras
TFLite saved → model/cnn_model.tflite (3,456 KB)

============================================================
DEEP LEARNING TRAINING COMPLETE — Summary:
DNN Accuracy : 96.45%
CNN Accuracy : 97.23%
Models saved in: model/
============================================================
```

---

## 🔌 API Endpoints

### Health Check
```
GET /health
Response: {"status": "OK"}
```

### Authentication
```
POST /login
Body: {"username": "admin", "password": "password"}
Response: {"token": "demo-token"}
```

### Get All Models Status
```
GET /models
Response: [
  {"name": "rf", "accuracy": 0.9423, "type": "classical_ml"},
  {"name": "linear_svm", "accuracy": 0.9156, "type": "classical_ml"},
  {"name": "dnn", "accuracy": 0.9645, "type": "deep_learning"},
  {"name": "cnn", "accuracy": 0.9723, "type": "deep_learning"}
]
```

### Get Model Metrics
```
GET /models/{model_name}/metrics

Example: GET /models/cnn/metrics
Response: {
  "model": "CNN",
  "accuracy": 0.9723,
  "precision": 0.9701,
  "recall": 0.9718,
  "f1": 0.9709,
  "confusion_matrix": [[...], [...]],
  "test_samples": 1500
}
```

### Get Model Features
```
GET /models/{model_name}/features

Example: GET /models/rf/features
Response: {
  "model": "rf",
  "features": ["feature_1", "feature_2", ...],
  "feature_count": 34
}
```

### Compare All Models
```
GET /compare
Response: {
  "models": [
    {"name": "rf", "accuracy": 0.9423, "f1": 0.9201, ...},
    {"name": "linear_svm", "accuracy": 0.9156, "f1": 0.8934, ...},
    {"name": "dnn", "accuracy": 0.9645, "f1": 0.9624, ...},
    {"name": "cnn", "accuracy": 0.9723, "f1": 0.9709, ...}
  ]
}
```

### Single Prediction
```
POST /predict
Body: {
  "model": "cnn",
  "feature_1": 0.5,
  "feature_2": 1.2,
  ...
}
Response: {
  "model": "cnn",
  "prediction": "benign",
  "confidence": 0.9823,
  "processing_time_ms": 12
}
```

### Batch Prediction (CSV Upload)
```
POST /upload
Body: multipart/form-data with CSV file
Response: {
  "total_rows": 100,
  "successful": 100,
  "failed": 0,
  "predictions": [
    {"index": 0, "prediction": "attack", "confidence": 0.876},
    ...
  ]
}
```

---

## 🎯 Running the Complete System

### Terminal 1: Start Backend API
```bash
cd Backend
venv\Scripts\activate  # Windows
python app.py
```

**Output:**
```
WARNING in flask_cors: ...
Running on http://127.0.0.1:5000
```

### Terminal 2: Start Frontend Dev Server
```bash
cd frontend
npm run dev
```

**Output:**
```
VITE v4.0.0  ready in X ms

➜  Local:   http://localhost:5173/
➜  Press h to show help
```

### Access the Application
- **Dashboard**: http://localhost:5173/
- **Backend API**: http://localhost:5000/
- **API Docs**: http://localhost:5000/models

---

## � Edge Deployment (Phase 3)

### Overview
Deploy trained models to IoT edge devices for real-time, on-device threat detection without cloud dependency.

### Why Edge Deployment?

**Benefits:**
- ✅ **Low Latency**: Sub-millisecond predictions (no network round-trip)
- ✅ **Offline Operation**: Works without internet connection
- ✅ **Privacy**: Data never leaves the device
- ✅ **Cost Savings**: Reduced cloud API calls
- ✅ **Scalability**: Deploy across thousands of devices
- ✅ **Reduced Bandwidth**: No data transmission overhead

**Use Cases:**
- Real-time anomaly detection on IoT devices
- Autonomous network security appliances
- Edge routers with built-in IDS
- Embedded systems and microcontrollers
- Industrial IoT security

### Deployment Architecture

```
IoT Device / Edge Device
├── TensorFlow Lite Runtime
│   └── Optimized Model (.tflite)
│       ├── Reduced model size (2-8 MB)
│       ├── Quantized weights (INT8)
│       ├── Optimized ops
│       └── Memory efficient
│
├── Local Preprocessing
│   ├── StandardScaler
│   ├── SimpleImputer
│   └── Feature normalization
│
└── Inference Engine
    ├── Load input features
    ├── Preprocess
    ├── Run prediction
    └── Return classification + confidence
```

### Supported Edge Platforms

#### 1. **TensorFlow Lite (Most Common)**
- **Devices**: Android, iOS, Raspberry Pi, Edge TPU
- **Runtime**: tflite_runtime (2-3 MB)
- **Models**: DNN (.tflite), CNN (.tflite)
- **Inference Speed**: 10-50 ms per sample

#### 2. **ONNX Runtime**
- **Devices**: Windows IoT, Linux, macOS
- **Runtime**: onnx-runtime (10-20 MB)
- **Models**: Convert Keras → ONNX
- **Inference Speed**: 15-60 ms per sample

#### 3. **Mobile Platforms**

**Android:**
```
- Runtime: TensorFlow Lite Android Interpreter
- Language: Java/Kotlin
- Size: 7-15 MB
- Performance: 20-100 ms per inference
```

**iOS:**
```
- Runtime: TensorFlow Lite iOS Pod
- Language: Swift/Objective-C
- Size: 3-8 MB
- Performance: 25-120 ms per inference
```

#### 4. **Specialized Hardware**
```
Google Coral TPU
├── Inference Speed: 1-5 ms per sample
├── Power: <1W
├── Cost: $150-300
└── Ideal for: Heavy workload, many devices

NVIDIA Jetson Nano
├── Inference Speed: 5-15 ms per sample
├── Power: 5W
├── Cost: $99-199
└── Ideal for: Computer vision + IDS

Raspberry Pi 4
├── Inference Speed: 50-200 ms per sample
├── Power: 3-6W
├── Cost: $35-75
└── Ideal for: Low-cost, single-device deployment
```

### Model Optimization for Edge

#### 1. **Quantization** (Already Applied in Training)

**INT8 Quantization**
```
Original (Float32)           Quantized (INT8)
├── Size: 100%              ├── Size: 25% ↓
├── Values: -3.4e38 to 3.4e38 ├── Values: -128 to 127
├── Precision: 32-bit       ├── Precision: 8-bit
└── Speed: Baseline         └── Speed: 4x faster
```

**How It Works:**
```python
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.representative_dataset = representative_data_gen
converter.target_spec.supported_ops = [
    tf.lite.OpsSet.TFLITE_BUILTINS_INT8
]
tflite_model = converter.convert()
```

**Trade-off:**
- Accuracy Loss: 0.5-2% (negligible)
- Speed Gain: 3-5x faster
- Memory Reduction: 75% smaller

#### 2. **Pruning** (Optional)
```
Removes less important weights
├── Sparsity: 30-50%
├── Size Reduction: 40-60%
├── Speed Improvement: 1.5-2x
└── Accuracy Loss: 1-3%
```

#### 3. **Model Compression**
```
Technique          Size Reduction    Speed    Accuracy Loss
────────────────────────────────────────────────────────────
None (Baseline)         100%          1x         0%
Quantization (INT8)      25%          4x        <1%
Pruning                  40-60%        2x        1-2%
Knowledge Distill        50-70%        2x        1-2%
Combined All             10-15%        8x        2-3%
```

### Step-by-Step Edge Deployment

#### Step 1: Verify TFLite Models Generated

```bash
# Check if models exist
dir Backend\model\*_model.tflite
```

**Expected Output:**
```
dnn_model.tflite      (2-8 MB)
cnn_model.tflite      (2-8 MB)
```

#### Step 2: Prepare Preprocessing Assets

```python
# Create edge_deployment/preprocessing.py
import joblib
import numpy as np

class EdgePreprocessor:
    """Lightweight preprocessing for edge devices"""
    
    def __init__(self, scaler_path, imputer_path):
        self.scaler = joblib.load(scaler_path)
        self.imputer = joblib.load(imputer_path)
    
    def preprocess(self, raw_features):
        """
        Args:
            raw_features: dict of feature_name → value
        
        Returns:
            numpy array ready for model input
        """
        # Handle missing values
        features_array = np.array(list(raw_features.values())).reshape(1, -1)
        features_imputed = self.imputer.transform(features_array)
        
        # Normalize
        features_scaled = self.scaler.transform(features_imputed)
        
        return features_scaled[0]  # Return 1D array
```

#### Step 3: Create Lightweight Inference Engine

```python
# edge_deployment/inference_engine.py
import tflite_runtime.interpreter as tflite
import numpy as np

class EdgeInferenceEngine:
    """TensorFlow Lite inference for IoT devices"""
    
    def __init__(self, model_path, preprocessor):
        """
        Args:
            model_path: Path to .tflite model
            preprocessor: EdgePreprocessor instance
        """
        self.interpreter = tflite.Interpreter(model_path=model_path)
        self.interpreter.allocate_tensors()
        
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()
        self.preprocessor = preprocessor
    
    def predict(self, raw_features):
        """
        Args:
            raw_features: dict of feature values
        
        Returns:
            {
                'prediction': str (attack/benign),
                'confidence': float,
                'inference_time_ms': float
            }
        """
        import time
        
        # Preprocess
        features = self.preprocessor.preprocess(raw_features)
        
        # Set input tensor
        self.interpreter.set_tensor(
            self.input_details[0]['index'],
            features.astype(np.float32).reshape(1, -1)
        )
        
        # Inference
        start = time.time()
        self.interpreter.invoke()
        inference_time = (time.time() - start) * 1000  # ms
        
        # Get output
        output = self.interpreter.get_tensor(self.output_details[0]['index'])
        confidence = float(np.max(output))
        prediction_idx = int(np.argmax(output))
        
        class_names = ["Benign", "DDoS", "Reconnaissance", "Theft", "Blackhole"]
        prediction = class_names[prediction_idx]
        
        return {
            'prediction': prediction,
            'confidence': confidence,
            'inference_time_ms': inference_time
        }
```

#### Step 4: Integration with IoT Device

**Example: Raspberry Pi with Network Sniffer**

```python
# edge_deployment/iot_ids.py
import socket
import struct
import textwrap
from inference_engine import EdgeInferenceEngine
from preprocessing import EdgePreprocessor

class IoTIDS:
    """Real-time network monitoring and threat detection"""
    
    def __init__(self, tflite_model_path, scaler_path, imputer_path):
        preprocessor = EdgePreprocessor(scaler_path, imputer_path)
        self.engine = EdgeInferenceEngine(tflite_model_path, preprocessor)
        self.threat_log = []
    
    def extract_flow_features(self, packet):
        """
        Extract network flow features from raw packet
        
        Returns:
            dict of features for model input
        """
        # Parse IP header
        src_ip, dst_ip, protocol = self._parse_ip(packet)
        
        # Extract TCP/UDP info
        src_port, dst_port, flags = self._parse_transport(packet)
        
        # Calculate flow statistics
        features = {
            'src_ip_numeric': self._ip_to_numeric(src_ip),
            'dst_ip_numeric': self._ip_to_numeric(dst_ip),
            'src_port': src_port,
            'dst_port': dst_port,
            'protocol': protocol,
            'packet_length': len(packet),
            'tcp_flags': flags if protocol == 6 else 0,
            # Add more features as needed
        }
        
        return features
    
    def monitor_traffic(self, interface=None):
        """
        Continuously monitor network traffic
        
        Detects threats in real-time
        """
        conn = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.ntohs(3))
        
        print("[*] Starting network monitoring...")
        print("[*] Press Ctrl+C to stop\n")
        
        try:
            while True:
                raw_data, addr = conn.recvfrom(65535)
                
                # Extract features
                features = self.extract_flow_features(raw_data)
                
                # Predict
                result = self.engine.predict(features)
                
                # Log threats
                if result['prediction'] != 'Benign':
                    self._log_threat(features, result)
                    self._alert(features, result)
        
        except KeyboardInterrupt:
            print("\n[*] Monitoring stopped")
            self._print_summary()
    
    def _log_threat(self, features, result):
        """Log detected threats"""
        threat_entry = {
            'timestamp': time.time(),
            'src_ip': features.get('src_ip'),
            'dst_ip': features.get('dst_ip'),
            'threat_type': result['prediction'],
            'confidence': result['confidence'],
            'inference_time': result['inference_time_ms']
        }
        self.threat_log.append(threat_entry)
    
    def _alert(self, features, result):
        """Send alert for detected threats"""
        print(f"\n[!] THREAT DETECTED!")
        print(f"    Type: {result['prediction']}")
        print(f"    Confidence: {result['confidence']:.2%}")
        print(f"    Source IP: {features.get('src_ip')}")
        print(f"    Inference: {result['inference_time_ms']:.2f}ms")
    
    def _print_summary(self):
        """Print threat summary"""
        print(f"\n[*] Threats detected: {len(self.threat_log)}")
        if self.threat_log:
            for threat in self.threat_log[:10]:
                print(f"    {threat['threat_type']} from {threat['src_ip']}")
```

#### Step 5: Docker Container for Edge Deployment

```dockerfile
# edge_deployment/Dockerfile
FROM python:3.9-slim

# Install TensorFlow Lite runtime (2-3 MB)
RUN pip install --index-url https://google-coral.github.io/py-repo/ tflite-runtime

WORKDIR /app

# Copy models and preprocessing
COPY dnn_model.tflite .
COPY cnn_model.tflite .
COPY scaler_cnn.pkl .
COPY imputer_cnn.pkl .
COPY features_cnn.pkl .

# Copy edge deployment code
COPY inference_engine.py .
COPY preprocessing.py .
COPY iot_ids.py .

# Install dependencies
RUN pip install numpy joblib

# Run IDS
CMD ["python", "iot_ids.py"]
```

**Build and Deploy:**
```bash
# Build container
docker build -t iot-ids:edge .

# Push to edge device registry
docker push your-registry/iot-ids:edge

# Run on edge device
docker run --privileged iot-ids:edge
```

### Performance Comparison: Cloud vs Edge

| Metric | Cloud API | Edge Device |
|--------|-----------|-------------|
| **Latency** | 100-500ms | 10-50ms |
| **Bandwidth** | 10-50 KB/request | 0 KB (local) |
| **Throughput** | 10-100 req/s | 1000+ req/s |
| **Cost** | $10-100/month | One-time hardware |
| **Privacy** | Data in cloud | Data local |
| **Reliability** | Depends on internet | Offline capable |
| **Scalability** | Limited by API | Unlimited (local) |

### Deployment Strategies

#### 1. **Single Device Deployment**
```
Ideal for: One Raspberry Pi, one network
Setup Time: 30 minutes
Cost: $100-150 (hardware)
Throughput: 100-500 packets/sec
Coverage: Single network segment
```

#### 2. **Multi-Device Cluster**
```
Ideal for: Multiple networks, enterprise IoT
Setup Time: 2-4 hours
Cost: $1000-5000 (10-50 devices)
Throughput: 1000-5000 packets/sec
Coverage: Multiple network segments
Communication: Local message queue
```

#### 3. **Federated Learning**
```
Ideal for: Many devices, continuous learning
Setup Time: 1-2 weeks
Cost: Variable (depends on infrastructure)
Features:
├── Each device improves local model
├── Periodic model aggregation
├── No raw data transmission
└── Better models over time
```

### Monitoring Edge Deployments

```python
# edge_deployment/monitoring.py
import json
from datetime import datetime

class EdgeMonitor:
    """Monitor edge device health and performance"""
    
    def __init__(self):
        self.metrics = {
            'total_inferences': 0,
            'avg_inference_time_ms': 0,
            'threats_detected': 0,
            'false_positive_rate': 0,
            'device_memory_usage': 0,
            'device_cpu_usage': 0,
            'last_update': None
        }
    
    def log_inference(self, inference_time_ms, prediction):
        """Log inference metrics"""
        self.metrics['total_inferences'] += 1
        self.metrics['avg_inference_time_ms'] = (
            (self.metrics['avg_inference_time_ms'] * 
             (self.metrics['total_inferences'] - 1) + 
             inference_time_ms) / self.metrics['total_inferences']
        )
        
        if prediction != 'Benign':
            self.metrics['threats_detected'] += 1
        
        self.metrics['last_update'] = datetime.now().isoformat()
    
    def get_metrics(self):
        """Return current metrics"""
        return self.metrics
    
    def export_metrics(self, filepath):
        """Export metrics to JSON"""
        with open(filepath, 'w') as f:
            json.dump(self.metrics, f, indent=2)
```

### Troubleshooting Edge Deployment

**Issue: Out of Memory**
```
Solution:
1. Use quantized model (INT8)
2. Batch size = 1
3. Use model pruning
4. Reduce feature count
```

**Issue: Slow Inference**
```
Solution:
1. Use Google Coral TPU
2. Reduce model complexity
3. Optimize preprocessing
4. Use hardware acceleration
```

**Issue: Low Accuracy**
```
Solution:
1. Verify preprocessing (scaling)
2. Check feature order
3. Retrain model on device data
4. Use federated learning
```

### Deployment Checklist

- [ ] Generate TFLite models (train_dl.py)
- [ ] Verify model files exist and sizes < 20 MB
- [ ] Copy preprocessing pickles to edge device
- [ ] Test inference locally on PC
- [ ] Deploy to edge hardware
- [ ] Monitor performance metrics
- [ ] Set up threat logging
- [ ] Configure alerts
- [ ] Document device configuration
- [ ] Plan model update strategy

### Next Steps for Production

1. **Version Control**: Track model versions
2. **A/B Testing**: Compare old vs new models
3. **Monitoring**: Track accuracy in production
4. **Retraining**: Monthly model updates
5. **Feedback Loop**: Collect edge data for retraining
6. **Security**: Sign models, verify authenticity

---

## �📁 Model Files Reference

### Classical ML Models
```
Backend/model/
├── rf_model.pkl              (10-50 MB)
├── features_rf.pkl
├── metrics_rf.pkl
│
├── linear_svm_model.pkl      (1-5 MB)
├── scaler_svm.pkl
├── imputer_svm.pkl
├── features_svm.pkl
└── metrics_svm.pkl
```

### Deep Learning Models
```
Backend/model/
├── dnn_model.keras           (5-20 MB)
├── dnn_model.tflite          (2-8 MB, optimized)
├── scaler_dnn.pkl
├── imputer_dnn.pkl
├── features_dnn.pkl
├── metrics_dnn.pkl
└── dnn_checkpoint.keras      (best weights)
│
├── cnn_model.keras           (5-20 MB)
├── cnn_model.tflite          (2-8 MB, optimized)
├── scaler_cnn.pkl
├── imputer_cnn.pkl
├── features_cnn.pkl
├── metrics_cnn.pkl
└── cnn_checkpoint.keras      (best weights)
```

---

## 🔍 Model Selection Guide

### Choose Random Forest If:
- ✅ Need fast inference (IoT edge devices)
- ✅ Interpretability is important
- ✅ Dataset size is moderate (1,000 - 1M rows)
- ✅ Real-time decisions required
- ✅ Limited computational resources

### Choose Linear SVM If:
- ✅ Fastest inference needed
- ✅ High-dimensional feature space
- ✅ Model size critical (edge deployment)
- ✅ Clear decision boundaries expected
- ✅ Computational constraints severe

### Choose DNN If:
- ✅ Good balance needed (speed/accuracy)
- ✅ Large dataset available (1M+ rows)
- ✅ Complex non-linear patterns
- ✅ Some interpretability acceptable
- ✅ Moderate computational resources

### Choose CNN If:
- ✅ Highest accuracy required
- ✅ Large dataset available
- ✅ Sequential/spatial patterns important
- ✅ Cloud deployment possible
- ✅ Sufficient computational resources
- ✅ Accuracy > interpretability

---

## 🔒 Security Considerations

1. **Data Privacy**
   - Normalize IP addresses before logging
   - Remove personally identifiable information
   - Use HTTPS for API communication

2. **Model Security**
   - Validate input dimensions before prediction
   - Rate limit API endpoints
   - Authenticate all requests

3. **Inference Safety**
   - Handle model prediction failures gracefully
   - Log anomalous inputs
   - Monitor inference latency

---

## 📊 Expected Performance Summary

### Training Time
- **Random Forest**: 30-60 seconds
- **Linear SVM**: 20-45 seconds
- **DNN**: 5-15 minutes (CPU) / 1-3 minutes (GPU)
- **CNN**: 10-20 minutes (CPU) / 2-5 minutes (GPU)

### Inference Speed (per sample)
- **Random Forest**: 1-5 ms
- **Linear SVM**: 0.5-2 ms
- **DNN**: 5-15 ms
- **CNN**: 10-25 ms

### Model Sizes
- **Random Forest**: 10-50 MB
- **Linear SVM**: 1-5 MB
- **DNN (Keras)**: 5-20 MB
- **DNN (TFLite)**: 2-8 MB
- **CNN (Keras)**: 5-20 MB
- **CNN (TFLite)**: 2-8 MB

---

## 🐛 Troubleshooting

### Issue: "Clean dataset not found"
```
Solution:
1. Ensure dataset.csv is in Backend/dataset/
2. Run: python preprocess.py
3. Check for preprocessing errors
```

### Issue: "No GPU detected"
```
Solution:
1. Training will default to CPU
2. Ensure TensorFlow installed: pip install tensorflow
3. For GPU support: pip install tensorflow[and-cuda]
```

### Issue: "Port 5000 already in use"
```
Solution:
1. Kill existing process: lsof -i :5000 | kill
2. Or specify different port: python app.py --port 5001
```

### Issue: "Model predictions inconsistent"
```
Solution:
1. Ensure scaler/imputer used for input preprocessing
2. Verify feature order matches training
3. Check for NaN or infinite values in input
```

---

## 📚 References & Documentation

### Libraries Documentation
- [scikit-learn Classifiers](https://scikit-learn.org/stable/supervised_learning.html)
- [TensorFlow/Keras API](https://www.tensorflow.org/api_docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)

### Dataset Papers
- Bot-IoT: A Dataset for Botnet Traffic Classification
- [Available at: Kaggle & UC San Diego](https://iotflipdataset.github.io/)

---

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

## 📄 License

This project is provided for educational and research purposes.

---

## 👨‍💼 Project Team

- **Data Science**: Model development and training
- **Backend**: Flask API and model serving
- **Frontend**: React dashboard and visualization

---

## 📞 Support

For issues or questions:
1. Check this README
2. Review code comments
3. Check GitHub Issues
4. Contact project maintainers

---

**Last Updated**: May 2026
**Project Status**: Active Development

