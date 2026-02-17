# AI-Driven Log-Based Threat Detection

## Overview

This project implements machine learning models to detect cyber threats and network intrusions using network activity logs. It compares multiple classification algorithms on the UNSW-NB15 dataset—a comprehensive benchmark dataset for network intrusion detection research.

The project evaluates **four distinct ML approaches** (XGBoost, Random Forest, Logistic Regression, and LDA) to identify the most effective model for distinguishing between normal network behavior and various attack patterns.

## Dataset

**UNSW-NB15** - Australian dataset containing:
- 257,673 network connection records
- 49 features capturing network flow characteristics
- 10 attack categories (DoS, Backdoor, Analysis, Fuzzers, Worms, Shellcode, Reconnaissance, Generic, Exploits, Normal)
- Real-world network traffic captures from the Cyber Range Lab

**Training & Testing Data:**
- `UNSW_NB15_training_grouped.csv` - Full training set
- `UNSW_NB15_testing_grouped.csv` - Full test set
- `UNSW_NB15_training_grouped_balanced_hybrid.csv` - Balanced training set
- `UNSW_NB15_testing_balanced_hybrid.csv` - Balanced test set

## Models Evaluated

| Model | Accuracy | Status | Details |
|-------|----------|--------|---------|
| **XGBoost** | 0.796 | ✓ Best Performer | Superior F1-score & balanced multi-class performance |
| **Random Forest** | 0.766 | ✓ Competitive | Slightly lower permutation importance scores |
| **Logistic Regression** | 0.683 | Used | Convergence warnings; weaker on minority classes |
| **LDA** | 0.681 | Baseline | Struggles with non-linear decision boundaries |

## Key Findings

- **XGBoost** emerges as the optimal model with superior generalization across all attack categories
- Ensemble methods (XGBoost, Random Forest) significantly outperform linear approaches
- Class imbalance mitigation through balanced sampling improves minority class detection
- Feature engineering through one-hot encoding of categorical variables is critical

## Project Structure

```
├── main.py                                      # Primary ML pipeline & model training
├── new_main.py                                  # Alternative implementation
├── full_final.py                                # Comprehensive analysis workflow
├── feature_importance.py                        # Feature importance analysis
├── testing.py                                   # Model evaluation & testing
├── time_metric.py                               # Performance timing analysis
│
├── Models/
│   ├── best_autoencoder.pt                      # Pre-trained autoencoder
│   ├── hybrid_ml_model.joblib                   # Serialized best model (XGBoost)
│   └── label_encoder.joblib                     # Label encoding mapping
│
├── Data/
│   ├── UNSW_NB15_training_grouped.csv           # Full training dataset
│   ├── UNSW_NB15_testing_grouped.csv            # Full test dataset
│   ├── UNSW_NB15_training_grouped_balanced_hybrid.csv
│   └── UNSW_NB15_testing_balanced_hybrid.csv
│
├── Reports/
│   ├── comparison.md                            # Model performance comparison
│   ├── logistic_regression.md                   # LR model details
│   ├── random_forest.md                         # RF model details
│   └── xgboost.md                               # XGBoost model details
│
├── feature_importance_plots/                    # Generated feature importance visualizations
├── sequence_autoencoder_output/                 # Autoencoder analysis outputs
│
├── code.ipynb                                   # Jupyter notebook for interactive analysis
└── README.md                                    # This file
```

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd AI-driven-Log-based-Threat-Detection

# Install dependencies
pip install -r requirements.txt
```

**Required Libraries:**
- pandas
- scikit-learn
- xgboost
- joblib
- numpy
- matplotlib / seaborn (for visualizations)

## Usage

### Train & Evaluate Models

```bash
# Run the primary ML pipeline
python main.py

# Alternative pipeline
python new_main.py

# Comprehensive analysis
python full_final.py
```

### Feature Analysis

```bash
# Generate feature importance scores and plots
python feature_importance.py
```

### Model Testing

```bash
# Evaluate loaded model on test data
python testing.py

# Analyze performance timing
python time_metric.py
```

### Interactive Analysis

```bash
# Open Jupyter notebook for exploratory analysis
jupyter notebook code.ipynb
```

## Model Pipeline

The ML pipeline follows this workflow:

1. **Data Loading** - Load UNSW-NB15 train/test splits
2. **Feature Alignment** - Ensure consistent feature matrices
3. **Preprocessing**:
   - Numerical features: StandardScaler normalization
   - Categorical features: OneHotEncoder encoding
4. **Model Training** - Train XGBoost, Random Forest, LR, and LDA
5. **Evaluation** - Classification reports, confusion matrices, metrics
6. **Feature Importance** - Identify most predictive network features
7. **Serialization** - Save best model and encoders as `.joblib` / `.pt` files

## Performance Metrics

Models are evaluated using:
- **Accuracy** - Overall correct predictions
- **Precision & Recall** - Per-class performance
- **F1-Score** - Harmonic mean of precision/recall
- **Confusion Matrix** - Class-wise misclassification patterns
- **ROC-AUC** - Multi-class discrimination capability

## Results & Deployment

- **Best Model**: XGBoost (accuracy: 0.796)
- **Serialized Model**: `hybrid_ml_model.joblib`
- **Feature Encoders**: `label_encoder.joblib`
- **Visualizations**: Feature importance plots in `feature_importance_plots/`

The trained model can be loaded for real-time threat detection on new network logs.

## Future Improvements

- Deep learning architectures (LSTM for sequence analysis)
- Explainability analysis (SHAP values, LIME)
- Real-time prediction pipeline deployment
- Cross-dataset generalization testing
- Automated hyperparameter optimization

## License

See [LICENSE](LICENSE) file for details.

---

**Author**: AI-Driven Security Analytics  
**Last Updated**: 2026  
**Dataset Reference**: UNSW-NB15 (Moustafa & Slay, 2015)
