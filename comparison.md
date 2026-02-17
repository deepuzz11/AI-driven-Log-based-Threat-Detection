| Model                   | Accuracy | Notes                                                                                     |
| ----------------------- | -------- | ----------------------------------------------------------------------------------------- |
| **XGBoost**             | 0.796    | Best overall F1-score and balanced performance across classes.                            |
| **Random Forest**       | 0.766    | Slightly worse than XGBoost; permutation importance scores are smaller.                   |
| **Logistic Regression** | 0.683    | Convergence warning; lower recall on some classes (especially 3).                         |
| **LDA**                 | 0.681    | Poor performance on class 3; not ideal for multi-class dataset with nonlinear boundaries. |
