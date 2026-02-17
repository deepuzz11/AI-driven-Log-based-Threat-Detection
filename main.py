# ====== 1. Imports ======
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix

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
numeric_cols = X_train.select_dtypes(include=["int64", "float64", "bool"]).columns.tolist()
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

# ====== 7. Train & Evaluate ======
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
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, digits=3))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
