# ====== 0. Force non-GUI backend ======
import matplotlib
import time
matplotlib.use('Agg')  # Avoid Tkinter errors when saving images

# ====== 1. Imports ======
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.inspection import permutation_importance
import os
from collections import defaultdict
import seaborn as sns

# Models
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis

# ====== 2. Load Data ======
train_path = "UNSW_NB15_training_grouped_balanced_hybrid.csv"
test_path  = "UNSW_NB15_testing_balanced_hybrid.csv"

train_df = pd.read_csv(train_path)
test_df  = pd.read_csv(test_path)

# ====== 3. Align Columns ======
target_col = "attack_cat_grouped"
missing_in_test = set(train_df.columns) - set(test_df.columns)
for col in missing_in_test:
    if col != target_col:
        test_df[col] = 0
test_df = test_df[train_df.columns]

# ====== 4. Features & Labels ======
X_train = train_df.drop(columns=[target_col])
y_train = train_df[target_col]
X_test  = test_df.drop(columns=[target_col])
y_test  = test_df[target_col]

# Identify numeric vs categorical columns
numeric_cols = X_train.select_dtypes(include=["int64","float64","bool"]).columns.tolist()
categorical_cols = X_train.select_dtypes(include=["object"]).columns.tolist()

# ====== 5. Preprocessing ======
preprocess = ColumnTransformer([
    ("num", StandardScaler(), numeric_cols),
    ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols)
])

# Label encode target
le = LabelEncoder()
y_train = le.fit_transform(y_train)
y_test  = le.transform(y_test)

# ====== 6. Models to Train ======
models = {
    "XGBoost": XGBClassifier(
        objective="multi:softmax",
        num_class=len(le.classes_),
        eval_metric="mlogloss",
        n_estimators=300,
        learning_rate=0.05,
        max_depth=8,
        subsample=0.8,
        colsample_bytree=0.8,
        tree_method="hist",
        random_state=42
    ),
    "Random Forest": RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    ),
    "Logistic Regression": LogisticRegression(
        max_iter=500,
        multi_class="multinomial",
        solver="lbfgs",
        n_jobs=-1
    ),
    "LDA": LinearDiscriminantAnalysis()
}

# ====== 7. Directory to save plots ======
os.makedirs("feature_importance_plots", exist_ok=True)

# ====== 8. Feature Importance Plot Function ======
def plot_feature_importance(feat_names, importance, title, filename):
    indices = np.argsort(importance)[::-1]
    sorted_feat_names = [feat_names[i] for i in indices]
    sorted_importance = importance[indices]

    n_features = len(feat_names)
    plt.figure(figsize=(12, max(8, n_features * 0.3)))
    plt.barh(range(n_features), sorted_importance, align='center', color='skyblue', edgecolor='black')
    plt.yticks(range(n_features), sorted_feat_names, fontsize=10)
    plt.gca().invert_yaxis()
    plt.title(title, fontsize=16)
    plt.xlabel("Importance Score", fontsize=12)
    plt.ylabel("Features", fontsize=12)
    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    plt.close()

    plt.figure(figsize=(12,6))
    plt.hist(sorted_importance, bins=30, color='lightgreen', edgecolor='black')
    plt.title(f"{title} Distribution", fontsize=16)
    plt.xlabel("Importance Score", fontsize=12)
    plt.ylabel("Frequency", fontsize=12)
    plt.tight_layout()
    plt.savefig(filename.replace(".png","_distribution.png"), dpi=300, bbox_inches='tight')
    plt.close()

# ====== 9. Failure Analysis Function ======
def analyze_failures(y_true, y_pred, label_encoder, model_name):
    cm = confusion_matrix(y_true, y_pred)
    labels = label_encoder.classes_

    print(f"\n==== Failure Analysis for {model_name} ====")
    print(f"Labels: {list(labels)}")
    print("Confusion Matrix:\n", cm)

    # Visualize Confusion Matrix
    plt.figure(figsize=(10,8))
    sns.heatmap(cm, annot=True, fmt="d", xticklabels=labels, yticklabels=labels, cmap="Blues")
    plt.xlabel("Predicted")
    plt.ylabel("True")
    plt.title(f"{model_name} Confusion Matrix")
    plt.tight_layout()
    plt.savefig(f"feature_importance_plots/{model_name}_confusion_matrix.png", dpi=300)
    plt.close()

# ====== 10. Training, Single-Sample Detection & Feature Importance ======
timing_results = []

for name, model in models.items():
    print("\n" + "="*20)
    print(f" Training & Detecting: {name}")
    print("="*20)
    
    clf = Pipeline([
        ("preprocessor", preprocess),
        ("model", model)
    ])
    
    # --- Training ---
    start_train = time.time()
    clf.fit(X_train, y_train)
    end_train = time.time()
    train_time = end_train - start_train

    # ====== 🔸 SINGLE SAMPLE DETECTION MOD ======
    # pick first sample (you can change index below)
    index = 0
    single_sample = X_test.iloc[[index]]
    single_true   = y_test[index]

    start_detect = time.time()
    y_pred = clf.predict(single_sample)
    end_detect = time.time()
    detect_time = end_detect - start_detect

    print(f"\n⏱️ Training Time: {train_time:.4f} sec")
    print(f"⚡ Single Sample Detection Time: {detect_time:.6f} sec")
    print(f"🧭 True Label: {le.inverse_transform([single_true])[0]}")
    print(f"🤖 Predicted: {le.inverse_transform(y_pred)[0]}")

    print("\nClassification Report:")
    print(classification_report([single_true], y_pred, digits=3))

    print("\nConfusion Matrix:")
    print(confusion_matrix([single_true], y_pred))

    timing_results.append({
        "Model": name,
        "Training Time (s)": train_time,
        "Detection Time (s)": detect_time,
        "Per Sample (ms)": detect_time * 1000
    })

    # --- Feature Importance ---
    if name in ["XGBoost", "Random Forest", "Logistic Regression"]:
        feature_names = numeric_cols.copy()
        if categorical_cols:
            cat_features = clf.named_steps['preprocessor'].named_transformers_['cat'].get_feature_names_out(categorical_cols)
            feature_names.extend(cat_features)

        if name in ["XGBoost", "Random Forest"]:
            importance = clf.named_steps['model'].feature_importances_
        else:
            importance = np.abs(clf.named_steps['model'].coef_[0])

        plot_feature_importance(
            feature_names,
            importance,
            title=f"{name} Feature Importance",
            filename=f"feature_importance_plots/{name}_feature_importance.png"
        )

# ====== 11. Timing Summary Table ======
print("\n\n========== 🕒 MODEL TIMING SUMMARY ==========")
summary_df = pd.DataFrame(timing_results)
print(summary_df.to_string(index=False))
