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
| Miss (0) | 391375 | 81541 |
| Make (1) | 241429 | 157460 |

## Classification Report

| label | precision | recall | f1-score | support |
| --- | --- | --- | --- | --- |
| Miss | 0.6185 | 0.8276 | 0.7079 | 472916 |
| Make | 0.6588 | 0.3947 | 0.4937 | 398889 |
| accuracy | n/a | n/a | 0.6295 | 871805 |
| macro avg | 0.6387 | 0.6112 | 0.6008 | 871805 |
| weighted avg | 0.6369 | 0.6295 | 0.6099 | 871805 |

## ROC-AUC Score

ROC-AUC: `0.6539`

## Feature Importance

| feature | importance |
| --- | --- |
| is_dunk | 0.5529 |
| distance_pressure_interaction | 0.1576 |
| shot_distance | 0.0383 |
| is_driving | 0.0315 |
| is_jump_shot | 0.0279 |
| is_pullup | 0.0268 |
| zone_paint | 0.0193 |
| is_hook | 0.0171 |
| is_tip | 0.0170 |
| quick_touch | 0.0148 |
| is_fadeaway | 0.0142 |
| game_clock_seconds | 0.0124 |
| is_layup | 0.0112 |
| abs_loc_x | 0.0080 |
| loc_y | 0.0060 |
| position_guard | 0.0059 |
| defender_distance | 0.0043 |
| pressure_open | 0.0042 |
| position_center | 0.0036 |
| long_three | 0.0036 |
| period | 0.0033 |
| touch_time | 0.0031 |
| zone_mid_range | 0.0029 |
| early_clock | 0.0029 |
| shot_value | 0.0027 |
| shot_clock | 0.0016 |
| loc_x | 0.0014 |
| pressure_very_open | 0.0012 |
| dribbles | 0.0012 |
| pressure_very_tight | 0.0010 |
| deep_two | 0.0008 |
| position_forward | 0.0008 |
| late_clock | 0.0003 |
| pressure_tight | 0.0002 |
| shot_angle | 0.0000 |
| is_home | 0.0000 |
| high_dribble | 0.0000 |
| zone_three_point | 0.0000 |

## Prediction Behavior By Shot Zone

| shot_zone | shots | actual_make_rate | avg_predicted_make_probability | predicted_make_rate_at_0.5 | roc_auc |
| --- | --- | --- | --- | --- | --- |
| Paint | 373237 | 0.5612 | 0.5607 | 0.5922 | 0.6990 |
| Mid-Range | 250270 | 0.4027 | 0.4025 | 0.0693 | 0.5582 |
| Three Point | 248298 | 0.3570 | 0.3581 | 0.0025 | 0.5462 |

## Average Predicted Make Probability By Zone

| shot_zone | avg_predicted_make_probability |
| --- | --- |
| Paint | 0.5607 |
| Mid-Range | 0.4025 |
| Three Point | 0.3581 |

## Prediction Behavior By Pressure Level

| pressure_level | shots | actual_make_rate | avg_predicted_make_probability | predicted_make_rate_at_0.5 | roc_auc |
| --- | --- | --- | --- | --- | --- |
| Very Tight | 6301 | 0.4552 | 0.4561 | 0.3201 | 0.6014 |
| Tight | 854270 | 0.4578 | 0.4579 | 0.2759 | 0.6545 |
| Open | 9765 | 0.4331 | 0.4304 | 0.1101 | 0.6293 |
| Very Open | 1469 | 0.4758 | 0.4635 | 0.1464 | 0.6449 |

## Average Predicted Make Probability By Pressure

| pressure_level | avg_predicted_make_probability |
| --- | --- |
| Very Tight | 0.4561 |
| Tight | 0.4579 |
| Open | 0.4304 |
| Very Open | 0.4635 |

## Notes

### What The Model Learned

The model learned broad relationships between shot context and made/missed outcomes. It uses distance, defender spacing, shot value, zone encodings, and pressure encodings to estimate the probability that a shot is made.

### Which Features Matter Most

The top feature by XGBoost importance is `is_dunk`. The highest-ranked features in this run are: is_dunk, distance_pressure_interaction, shot_distance, is_driving, is_jump_shot.

### Where The Model May Be Weak

The model may be weak where groups have fewer shots, where engineered labels hide detail, or where important basketball context is missing. Current features do not include shooter identity, game context, exact court coordinates, release mechanics, lineup context, or defender quality.

### Why The Backend Still Needs Rule-Based Fallback

The backend still needs rule-based fallback because the model file can be missing, incompatible with the current feature builder, trained on prototype data, or asked to predict inputs outside the training distribution. Fallback keeps the API useful and stable instead of failing a live request.
