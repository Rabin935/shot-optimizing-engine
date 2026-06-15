# ShotOptix XGBoost Model Evaluation

## Data And Integration Notes

- Model file: `backend/trained_models/shot_xgboost_model.pkl`
- Dataset: `data/processed/shotoptix_ml_training.csv`
- Test split: `20%` with `random_state=42`
- Model metadata phase: `Step 6 - Save Trained ShotOptix XGBoost Model`
- Dataset note: this evaluation uses the provided normalized shot log dataset with a real made/missed target column. Shot zone and pressure are engineered features. If this dataset is replaced with synthetic or rule-generated data, treat the results as prototype results, not real basketball accuracy.
- The saved model feature list matches the shared backend feature builder.

## Confusion Matrix

Rows are actual labels and columns are predicted labels.

| Actual \ Predicted | Miss (0) | Make (1) |
| --- | ---: | ---: |
| Miss (0) | 11697 | 2336 |
| Make (1) | 7584 | 3997 |

## Classification Report

| label | precision | recall | f1-score | support |
| --- | --- | --- | --- | --- |
| Miss | 0.6067 | 0.8335 | 0.7022 | 14033 |
| Make | 0.6311 | 0.3451 | 0.4462 | 11581 |
| accuracy | n/a | n/a | 0.6127 | 25614 |
| macro avg | 0.6189 | 0.5893 | 0.5742 | 25614 |
| weighted avg | 0.6177 | 0.6127 | 0.5865 | 25614 |

## ROC-AUC Score

ROC-AUC: `0.6307`

## Feature Importance

| feature | importance |
| --- | --- |
| zone_paint | 0.4962 |
| pressure_very_tight | 0.1340 |
| shot_distance | 0.1250 |
| defender_distance | 0.0742 |
| pressure_tight | 0.0568 |
| shot_value | 0.0323 |
| pressure_very_open | 0.0320 |
| pressure_open | 0.0220 |
| zone_mid_range | 0.0171 |
| zone_three_point | 0.0103 |
| shot_angle | 0.0000 |

## Prediction Behavior By Shot Zone

| shot_zone | shots | actual_make_rate | avg_predicted_make_probability | predicted_make_rate_at_0.5 | roc_auc |
| --- | --- | --- | --- | --- | --- |
| Paint | 9825 | 0.5647 | 0.5634 | 0.6194 | 0.6453 |
| Mid-Range | 8899 | 0.4024 | 0.4014 | 0.0255 | 0.5462 |
| Three Point | 6890 | 0.3559 | 0.3522 | 0.0029 | 0.5607 |

## Average Predicted Make Probability By Zone

| shot_zone | avg_predicted_make_probability |
| --- | --- |
| Paint | 0.5634 |
| Mid-Range | 0.4014 |
| Three Point | 0.3522 |

## Prediction Behavior By Pressure Level

| pressure_level | shots | actual_make_rate | avg_predicted_make_probability | predicted_make_rate_at_0.5 | roc_auc |
| --- | --- | --- | --- | --- | --- |
| Very Tight | 6191 | 0.4595 | 0.4544 | 0.3520 | 0.5949 |
| Tight | 8173 | 0.4643 | 0.4686 | 0.3390 | 0.6595 |
| Open | 9737 | 0.4336 | 0.4299 | 0.1164 | 0.6092 |
| Very Open | 1513 | 0.4752 | 0.4654 | 0.1652 | 0.6295 |

## Average Predicted Make Probability By Pressure

| pressure_level | avg_predicted_make_probability |
| --- | --- |
| Very Tight | 0.4544 |
| Tight | 0.4686 |
| Open | 0.4299 |
| Very Open | 0.4654 |

## Notes

### What The Model Learned

The model learned broad relationships between shot context and made/missed outcomes. It uses distance, defender spacing, shot value, zone encodings, and pressure encodings to estimate the probability that a shot is made.

### Which Features Matter Most

The top feature by XGBoost importance is `zone_paint`. The highest-ranked features in this run are: zone_paint, pressure_very_tight, shot_distance, defender_distance, pressure_tight.

### Where The Model May Be Weak

The model may be weak where groups have fewer shots, where engineered labels hide detail, or where important basketball context is missing. Current features do not include shooter identity, game context, exact court coordinates, release mechanics, lineup context, or defender quality.

### Why The Backend Still Needs Rule-Based Fallback

The backend still needs rule-based fallback because the model file can be missing, incompatible with the current feature builder, trained on prototype data, or asked to predict inputs outside the training distribution. Fallback keeps the API useful and stable instead of failing a live request.
