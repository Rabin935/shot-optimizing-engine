# Phase 4 ML Model Integration Notes

These notes explain the Phase 4 ShotOptix machine learning workflow in simple
terms for project documentation, demos, and viva preparation.

## 1. Phase 4 Overview

Phase 4 adds a trained XGBoost model to the ShotOptix backend. The model
predicts the probability that a shot will be made. The API still calculates
Expected Points Per Shot (EPPS), shot quality, recommendation, and confidence
after the probability is selected.

## 2. What Changed From Phase 3

Phase 3 used a rule-based predictor. It estimated make probability with fixed
rules such as "open shots are better" and "tight pressure lowers probability."

Phase 4 keeps those rules but adds ML first:

- Try the trained XGBoost model.
- If ML works, use the ML make probability.
- If ML fails or the file is missing, use the Phase 3 rule-based fallback.

## 3. Rule-Based Prediction vs ML Prediction

Rule-based prediction is easy to explain because every adjustment is written in
code. It is useful as a reliable fallback.

ML prediction learns from data. The model looks at historical shot examples and
learns patterns between features such as distance, pressure, shot value, and the
final made/missed result.

## 4. Dataset Used

The model workflow uses the cleaned shot log dataset:

```text
data/processed/cleaned_shot_logs.csv
```

The raw source data lives in:

```text
data/raw/shot_logs.csv
```

## 5. Feature Engineering

Feature engineering means converting raw shot information into columns the model
can understand.

Numeric values stay numeric:

- `shot_distance`
- `shot_angle`
- `defender_distance`
- `shot_value`

Text values are converted into one-hot columns:

- Shot zones become columns like `shot_zone_paint` and
  `shot_zone_three_point`.
- Pressure levels become columns like `pressure_tight` and `pressure_open`.

The backend feature code is:

```text
backend/app/ml/feature_builder.py
```

## 6. Target Variable

The target variable is:

```text
shot_made
```

It is the value the model tries to predict:

- `1` means the shot was made.
- `0` means the shot was missed.

## 7. XGBoost Explanation

XGBoost is a machine learning model that combines many small decision trees. A
decision tree asks simple questions, such as whether a shot is far from the
basket or whether a defender is close. XGBoost combines many trees to produce a
stronger prediction.

ShotOptix uses the model probability output, so the result is a number between
`0` and `1`. For example, `0.38` means the model estimates a 38 percent make
probability.

## 8. Model Training Process

The training process follows this flow:

1. Load the cleaned shot log dataset.
2. Select useful shot features.
3. Convert categorical values into one-hot columns.
4. Train an XGBoost classifier using `shot_made` as the target.
5. Evaluate the model with classification metrics.
6. Save the trained model and metadata for FastAPI inference.

The notebook workflow lives in:

```text
notebooks/
```

## 9. Model Evaluation Metrics

The saved metadata includes:

- Accuracy: overall percentage of correct made/missed predictions.
- Precision: when the model predicts a make, how often it is correct.
- Recall: how many actual makes the model finds.
- F1 score: balance between precision and recall.
- ROC AUC: how well the model separates made shots from missed shots across
  thresholds.

These metrics are stored in:

```text
backend/trained_models/model_metadata.json
```

## 10. Saved Model Location

```text
backend/trained_models/shot_xgboost_model.pkl
backend/trained_models/model_metadata.json
```

## 11. Backend Integration

The backend integration uses these files:

- `backend/app/ml/model_loader.py` loads the saved model and metadata.
- `backend/app/ml/feature_builder.py` creates the model input features.
- `backend/app/services/ml_shot_predictor.py` runs `predict_proba`.
- `backend/app/services/shot_predictor.py` chooses ML first, fallback second.
- `backend/app/main.py` exposes the API endpoints.

The ML service is intentionally separate from the rule-based service so Phase 3
logic remains available.

## 12. Fallback Behavior

If the model file is missing, cannot be loaded, or fails during prediction, the
backend returns `None` from the ML layer. The main shot predictor then uses the
Phase 3 rule-based probability.

This keeps demos and development stable because `/api/predict-shot` still works
even without the model file.

## 13. API Endpoints

### `POST /api/predict-shot`

Returns:

- `make_probability`
- `make_probability_percent`
- `shot_value`
- `epps`
- `shot_quality`
- `recommendation`
- `confidence`
- `prediction_source`

`prediction_source` is either:

- `ml_model`
- `rule_based_fallback`

### `GET /api/model-info`

Returns whether the model is loaded, the model name, model type, features used,
target column, phase, and fallback type.

Example:

```json
{
  "model_loaded": true,
  "model_name": "ShotOptix XGBoost Shot Model",
  "model_type": "XGBoostClassifier",
  "features_used": ["shot_distance", "shot_angle"],
  "target_column": "shot_made",
  "phase": "Phase 4",
  "prediction_fallback": "rule_based"
}
```

## 14. Frontend Prediction Source Display

The frontend sandbox displays a small badge in the stats panel:

- `ML Model` when the backend used the trained model.
- `Rule-Based Fallback` when the backend used Phase 3 rules.
- `Prediction Engine` if an older backend response does not include the field.

This helps users understand whether they are seeing ML inference or fallback
logic.

## 15. Phase 5 Improvements

Phase 5 can improve:

- Model accuracy with better features and more data.
- Probability calibration so outputs better match real make rates.
- Player-specific or context-specific predictions.
- Frontend model health indicators.
- Clear explanations for why a shot was rated good or poor.
- Automated tests around missing-model fallback behavior.
