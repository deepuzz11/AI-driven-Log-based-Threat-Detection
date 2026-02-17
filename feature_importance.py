# ====== 0. Force non-GUI backend ======
import matplotlib
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

# ====== 8. Function to Plot Feature Importance ======
def plot_feature_importance(feat_names, importance, title="Feature Importance", filename="feature_importance.png"):
    # Sort features by importance
    indices = np.argsort(importance)[::-1]
    sorted_feat_names = [feat_names[i] for i in indices]
    sorted_importance = importance[indices]
    
    # Dynamically adjust figure height based on number of features
    n_features = len(feat_names)
    plt.figure(figsize=(12, max(8, n_features * 0.3)))
    
    # Horizontal bar chart
    plt.barh(range(n_features), sorted_importance, align='center', color='skyblue', edgecolor='black')
    plt.yticks(range(n_features), sorted_feat_names, fontsize=10)
    plt.gca().invert_yaxis()
    plt.title(title, fontsize=16)
    plt.xlabel("Importance Score", fontsize=12)
    plt.ylabel("Features", fontsize=12)
    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    plt.close()
    
    # Histogram to show distribution
    plt.figure(figsize=(12,6))
    plt.hist(sorted_importance, bins=30, color='lightgreen', edgecolor='black')
    plt.title(f"{title} Distribution", fontsize=16)
    plt.xlabel("Importance Score", fontsize=12)
    plt.ylabel("Frequency", fontsize=12)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(filename.replace(".png","_distribution.png"), dpi=300, bbox_inches='tight')
    plt.close()

# ====== 9. Train, Evaluate & Feature Importance ======
for name, model in models.items():
    print("\n" + "="*20)
    print(f" Training: {name}")
    print("="*20)
    
    clf = Pipeline([
        ("preprocessor", preprocess),
        ("model", model)
    ])
    
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    
    # Evaluation
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, digits=3))
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Feature Importance (only for tree-based or linear models)
    if name in ["XGBoost", "Random Forest", "Logistic Regression"]:
        print("\n" + "-"*10 + " Feature Importance " + "-"*10)
        
        # Feature names after preprocessing
        feature_names = numeric_cols.copy()
        if categorical_cols:
            cat_features = clf.named_steps['preprocessor'].named_transformers_['cat'].get_feature_names_out(categorical_cols)
            feature_names.extend(cat_features)
        
        # Tree-based models
        if name in ["XGBoost", "Random Forest"]:
            importance = clf.named_steps['model'].feature_importances_
            plot_feature_importance(
                feature_names,
                importance,
                title=f"{name} Feature Importance",
                filename=f"feature_importance_plots/{name}_feature_importance.png"
            )
        
        # Logistic Regression
        elif name == "Logistic Regression":
            importance = np.abs(clf.named_steps['model'].coef_[0])
            plot_feature_importance(
                feature_names,
                importance,
                title=f"{name} Coefficients Importance",
                filename=f"feature_importance_plots/{name}_feature_importance.png"
            )
        
        # Permutation Importance (model-agnostic)
        perm_importance = permutation_importance(clf, X_test, y_test, n_repeats=10, random_state=42)
        print("\nTop 10 Features by Permutation Importance:")
        top_idx = perm_importance.importances_mean.argsort()[::-1][:10]
        for i in top_idx:
            print(f"{feature_names[i]}: {perm_importance.importances_mean[i]:.4f}")
