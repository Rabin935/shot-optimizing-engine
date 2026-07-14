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
| Miss (0) | 810635 | 174614 |
| Make (1) | 505082 | 320855 |

## Classification Report

| label | precision | recall | f1-score | support |
| --- | --- | --- | --- | --- |
| Miss | 0.6161 | 0.8228 | 0.7046 | 985249 |
| Make | 0.6476 | 0.3885 | 0.4856 | 825937 |
| accuracy | n/a | n/a | 0.6247 | 1811186 |
| macro avg | 0.6318 | 0.6056 | 0.5951 | 1811186 |
| weighted avg | 0.6305 | 0.6247 | 0.6047 | 1811186 |

## ROC-AUC Score

ROC-AUC: `0.6415`

## Feature Importance

| feature | importance |
| --- | --- |
| is_dunk | 0.3817 |
| shot_distance | 0.1488 |
| distance_pressure_interaction | 0.1446 |
| game_clock_seconds | 0.0258 |
| is_hook | 0.0258 |
| is_pullup | 0.0228 |
| is_driving | 0.0208 |
| is_fadeaway | 0.0173 |
| long_three | 0.0171 |
| is_jump_shot | 0.0161 |
| is_tip | 0.0154 |
| zone_three_point | 0.0139 |
| loc_y | 0.0137 |
| is_layup | 0.0128 |
| position_guard | 0.0120 |
| zone_paint | 0.0106 |
| loc_x | 0.0105 |
| abs_loc_x | 0.0094 |
| pressure_open | 0.0087 |
| period | 0.0076 |
| touch_time | 0.0071 |
| defender_distance | 0.0067 |
| quick_touch | 0.0057 |
| player_season_exp | 0.0051 |
| player_height_inches | 0.0048 |
| defender_height_pressure | 0.0042 |
| player_weight | 0.0037 |
| player_draft_number | 0.0032 |
| shot_clock | 0.0032 |
| defender_length_pressure | 0.0030 |
| shot_value | 0.0028 |
| position_forward | 0.0027 |
| zone_mid_range | 0.0023 |
| position_center | 0.0022 |
| deep_two | 0.0014 |
| early_clock | 0.0012 |
| defender_wingspan_in | 0.0010 |
| dribbles | 0.0009 |
| defender_d_dpm | 0.0008 |
| pressure_very_open | 0.0008 |
| defender_height_wo_shoes_in | 0.0007 |
| pressure_tight | 0.0006 |
| defender_wingspan_diff_in | 0.0005 |
| shot_angle | 0.0000 |
| is_home | 0.0000 |
| high_dribble | 0.0000 |
| late_clock | 0.0000 |
| pressure_very_tight | 0.0000 |

## Prediction Behavior By Shot Zone

| shot_zone | shots | actual_make_rate | avg_predicted_make_probability | predicted_make_rate_at_0.5 | roc_auc |
| --- | --- | --- | --- | --- | --- |
| Paint | 768409 | 0.5580 | 0.5583 | 0.6251 | 0.6740 |
| Mid-Range | 551191 | 0.4002 | 0.4002 | 0.0261 | 0.5456 |
| Three Point | 491586 | 0.3592 | 0.3592 | 0.0015 | 0.5454 |

## Average Predicted Make Probability By Zone

| shot_zone | avg_predicted_make_probability |
| --- | --- |
| Paint | 0.5583 |
| Mid-Range | 0.4002 |
| Three Point | 0.3592 |

## Prediction Behavior By Pressure Level

| pressure_level | shots | actual_make_rate | avg_predicted_make_probability | predicted_make_rate_at_0.5 | roc_auc |
| --- | --- | --- | --- | --- | --- |
| Very Tight | 6331 | 0.4514 | 0.4635 | 0.3477 | 0.6034 |
| Tight | 1793735 | 0.4562 | 0.4562 | 0.2742 | 0.6416 |
| Open | 9673 | 0.4274 | 0.4328 | 0.1190 | 0.6299 |
| Very Open | 1447 | 0.4644 | 0.4638 | 0.1534 | 0.6240 |

## Average Predicted Make Probability By Pressure

| pressure_level | avg_predicted_make_probability |
| --- | --- |
| Very Tight | 0.4635 |
| Tight | 0.4562 |
| Open | 0.4328 |
| Very Open | 0.4638 |

## Notes

### What The Model Learned

The model learned broad relationships between shot context and made/missed outcomes. It uses distance, defender spacing, shot value, zone encodings, and pressure encodings to estimate the probability that a shot is made.

### Which Features Matter Most

The top feature by XGBoost importance is `is_dunk`. The highest-ranked features in this run are: is_dunk, shot_distance, distance_pressure_interaction, game_clock_seconds, is_hook.

### Where The Model May Be Weak

The model may be weak where groups have fewer shots, where engineered labels hide detail, or where important basketball context is missing. Current features do not include shooter identity, game context, exact court coordinates, release mechanics, lineup context, or defender quality.

### Why The Backend Still Needs Rule-Based Fallback

The backend still needs rule-based fallback because the model file can be missing, incompatible with the current feature builder, trained on prototype data, or asked to predict inputs outside the training distribution. Fallback keeps the API useful and stable instead of failing a live request.
