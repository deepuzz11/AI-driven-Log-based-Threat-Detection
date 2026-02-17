import pandas as pd
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from imblearn.pipeline import Pipeline
from collections import Counter
from sklearn.preprocessing import LabelEncoder

# --- Step 1: Load and Prepare the Testing Data ---
try:
    df_test = pd.read_csv('UNSW_NB15_testing_grouped.csv')
    print("Testing dataset loaded successfully.")
except FileNotFoundError:
    print("Error: 'UNSW_NB15_testing_grouped.csv' not found.")
    exit()

# Drop rows with missing target
df_test = df_test.dropna(subset=['attack_cat_grouped'])

# Encode attack categories into integers
le = LabelEncoder()
df_test['attack_cat_grouped'] = le.fit_transform(df_test['attack_cat_grouped'])

# Separate features (X_test) and target (y_test)
X_test = df_test.drop(['id', 'attack_cat', 'label', 'attack_cat_grouped'], axis=1)
y_test = df_test['attack_cat_grouped']

# One-hot encode categorical columns
X_test = pd.get_dummies(X_test, columns=['proto', 'service', 'state'], drop_first=True)

print("\nOriginal testing dataset shape:", Counter(y_test))

# --- Step 2: Perform Hybrid Sampling on Testing Data ---
# Strategy: undersample majority, oversample minority until balance
# We’ll bring all classes to the size of the smallest class

min_class_count = min(Counter(y_test).values())

undersample_strategy = {cls: min_class_count for cls in Counter(y_test).keys()}
oversample_strategy = {cls: min_class_count for cls in Counter(y_test).keys()}

undersample = RandomUnderSampler(sampling_strategy=undersample_strategy, random_state=42)
oversample = SMOTE(sampling_strategy='not majority', random_state=42)

# Pipeline for hybrid balancing
pipeline = Pipeline(steps=[('undersample', undersample), ('oversample', oversample)])

X_test_resampled, y_test_resampled = pipeline.fit_resample(X_test, y_test)

# --- Step 3: Verify and Save the Balanced Testing Dataset ---
print("\nResampled testing dataset shape:", Counter(y_test_resampled))

# Convert back to original category names
y_test_resampled_labels = le.inverse_transform(y_test_resampled)

# Save to CSV
balanced_test_df = pd.DataFrame(X_test_resampled, columns=X_test.columns)
balanced_test_df['attack_cat_grouped'] = y_test_resampled_labels

output_file = 'UNSW_NB15_testing_balanced_hybrid.csv'
balanced_test_df.to_csv(output_file, index=False)
print(f"\nSuccessfully created and saved the balanced testing dataset to '{output_file}'")
