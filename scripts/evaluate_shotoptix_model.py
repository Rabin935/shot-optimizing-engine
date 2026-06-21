import json
import sys
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.model_selection import train_test_split


ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
TRAINING_DATA_PATH = ROOT_DIR / "data" / "processed" / "shotoptix_ml_training.csv"
REPORT_PATH = ROOT_DIR / "data" / "processed" / "model_evaluation_report.md"
MODEL_PATH = BACKEND_DIR / "trained_models" / "shot_xgboost_model.pkl"
METADATA_PATH = BACKEND_DIR / "trained_models" / "model_metadata.json"

TARGET_COLUMN = "shot_made"
TEST_SIZE = 0.2
RANDOM_STATE = 42
POSITIVE_CLASS = 1

SHOT_ZONES = ["Paint", "Mid-Range", "Three Point"]
PRESSURE_LEVELS = ["Very Tight", "Tight", "Open", "Very Open"]

# Allow this script to import backend/app modules when run from the project root.
sys.path.insert(0, str(BACKEND_DIR))
from app.ml.feature_builder import MODEL_FEATURES as SHARED_MODEL_FEATURES  # noqa: E402


def load_metadata() -> dict[str, Any]:
    # Model metadata stores the exact feature list used when the model was saved.
    if not METADATA_PATH.exists():
        raise FileNotFoundError(f"Model metadata not found: {METADATA_PATH}")

    return json.loads(METADATA_PATH.read_text(encoding="utf-8"))


def load_dataset() -> pd.DataFrame:
    # Evaluation uses the normalized training dataset, not raw unprocessed logs.
    if not TRAINING_DATA_PATH.exists():
        raise FileNotFoundError(f"Training dataset not found: {TRAINING_DATA_PATH}")

    df = pd.read_csv(TRAINING_DATA_PATH)
    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Dataset must contain target column: {TARGET_COLUMN}")

    return df


def normalize_text(value: object) -> str:
    # Normalize labels so case, hyphens, and underscores do not change encoding.
    if pd.isna(value):
        return ""

    return str(value).strip().lower().replace("-", " ").replace("_", " ")


def add_numeric_feature(features: pd.DataFrame, df: pd.DataFrame, column: str) -> None:
    # Numeric features are converted safely so invalid values become zero.
    if column in df.columns:
        features[column] = pd.to_numeric(df[column], errors="coerce").fillna(0.0)
    else:
        features[column] = 0.0


def add_zone_features(features: pd.DataFrame, df: pd.DataFrame) -> None:
    # Build both current and legacy zone columns so old saved models can be evaluated.
    zone = df.get("shot_zone", pd.Series("Mid-Range", index=df.index)).apply(
        normalize_text
    )
    is_paint = zone == "paint"
    is_mid_range = zone.isin({"mid range", "midrange"})
    is_three_point = zone.str.contains("three") | zone.isin({"3pt", "3 point"})
    is_corner_three = zone == "corner three"

    features["zone_paint"] = is_paint.astype(int)
    features["zone_mid_range"] = is_mid_range.astype(int)
    features["zone_three_point"] = is_three_point.astype(int)
    features["shot_zone_paint"] = is_paint.astype(int)
    features["shot_zone_mid_range"] = is_mid_range.astype(int)
    features["shot_zone_three_point"] = is_three_point.astype(int)
    features["shot_zone_corner_three"] = is_corner_three.astype(int)


def add_pressure_features(features: pd.DataFrame, df: pd.DataFrame) -> None:
    # Build pressure one-hot columns used by both saved and current feature formats.
    pressure = df.get("pressure_level", pd.Series("Tight", index=df.index)).apply(
        normalize_text
    )

    features["pressure_very_tight"] = (pressure == "very tight").astype(int)
    features["pressure_tight"] = (pressure == "tight").astype(int)
    features["pressure_open"] = (pressure == "open").astype(int)
    features["pressure_very_open"] = pressure.isin({"very open", "wide open"}).astype(
        int
    )


def build_features_for_model(df: pd.DataFrame, feature_names: list[str]) -> pd.DataFrame:
    # Create every known feature, then return only the model's expected order.
    features = pd.DataFrame(index=df.index)

    for column in ["shot_distance", "shot_angle", "defender_distance", "shot_value"]:
        add_numeric_feature(features, df, column)

    add_zone_features(features, df)
    add_pressure_features(features, df)

    missing_features = [column for column in feature_names if column not in features]
    if missing_features:
        raise ValueError(f"Cannot build required features: {missing_features}")

    return features[feature_names]


def get_positive_class_probabilities(model: Any, X_test: pd.DataFrame) -> list[float]:
    # XGBoost returns one probability column per class; find the made-shot column.
    probabilities = model.predict_proba(X_test)
    classes = list(getattr(model, "classes_", [0, 1]))

    if POSITIVE_CLASS in classes:
        positive_class_index = classes.index(POSITIVE_CLASS)
    else:
        positive_class_index = 1

    return probabilities[:, positive_class_index].tolist()


def safe_roc_auc(y_true: pd.Series, y_probability: pd.Series) -> float | None:
    # ROC-AUC only exists when a group has both made and missed examples.
    if y_true.nunique() < 2:
        return None

    return float(roc_auc_score(y_true, y_probability))


def summarize_group_behavior(
    predictions: pd.DataFrame,
    group_column: str,
    ordered_values: list[str],
) -> pd.DataFrame:
    # Compare actual and predicted behavior for each basketball category.
    rows = []

    for value in ordered_values:
        group = predictions[predictions[group_column] == value]
        if group.empty:
            rows.append(
                {
                    group_column: value,
                    "shots": 0,
                    "actual_make_rate": None,
                    "avg_predicted_make_probability": None,
                    "predicted_make_rate_at_0.5": None,
                    "roc_auc": None,
                }
            )
            continue

        rows.append(
            {
                group_column: value,
                "shots": int(len(group)),
                "actual_make_rate": float(group["actual_make"].mean()),
                "avg_predicted_make_probability": float(
                    group["predicted_make_probability"].mean()
                ),
                "predicted_make_rate_at_0.5": float(group["predicted_make"].mean()),
                "roc_auc": safe_roc_auc(
                    group["actual_make"],
                    group["predicted_make_probability"],
                ),
            }
        )

    return pd.DataFrame(rows)


def build_feature_importance(model: Any, feature_names: list[str]) -> pd.DataFrame:
    # Feature importance shows which inputs XGBoost relied on most.
    importances = getattr(model, "feature_importances_", None)
    if importances is None:
        return pd.DataFrame(columns=["feature", "importance"])

    return (
        pd.DataFrame({"feature": feature_names, "importance": importances})
        .sort_values("importance", ascending=False)
        .reset_index(drop=True)
    )


def format_float(value: object) -> str:
    # Format floats for readable Markdown tables while preserving missing values.
    if value is None or pd.isna(value):
        return "n/a"

    return f"{float(value):.4f}"


def dataframe_to_markdown(
    df: pd.DataFrame,
    float_columns: list[str] | None = None,
    integer_columns: list[str] | None = None,
) -> str:
    # Convert a dataframe into a Markdown table without requiring tabulate.
    float_columns = float_columns or []
    integer_columns = integer_columns or []
    display_df = df.copy()

    for column in float_columns:
        if column in display_df.columns:
            display_df[column] = display_df[column].apply(format_float)

    for column in integer_columns:
        if column in display_df.columns:
            display_df[column] = display_df[column].apply(
                lambda value: "n/a" if pd.isna(value) else str(int(value))
            )

    display_df = display_df.fillna("n/a")
    columns = list(display_df.columns)
    header = "| " + " | ".join(columns) + " |"
    separator = "| " + " | ".join(["---"] * len(columns)) + " |"
    rows = [
        "| " + " | ".join(str(row[column]) for column in columns) + " |"
        for _, row in display_df.iterrows()
    ]

    return "\n".join([header, separator, *rows])


def classification_report_to_dataframe(report: dict[str, Any]) -> pd.DataFrame:
    # Flatten sklearn's classification report dictionary into report rows.
    rows = []
    total_support = int(report["macro avg"]["support"])

    for label in ["0", "1", "accuracy", "macro avg", "weighted avg"]:
        value = report[label]
        if label == "accuracy":
            rows.append(
                {
                    "label": "accuracy",
                    "precision": None,
                    "recall": None,
                    "f1-score": float(value),
                    "support": total_support,
                }
            )
        else:
            rows.append(
                {
                    "label": "Miss" if label == "0" else "Make" if label == "1" else label,
                    "precision": value["precision"],
                    "recall": value["recall"],
                    "f1-score": value["f1-score"],
                    "support": int(value["support"]),
                }
            )

    return pd.DataFrame(rows)


def relative_markdown_path(path: Path) -> str:
    # Use forward slashes so report paths render cleanly in Markdown.
    return path.relative_to(ROOT_DIR).as_posix()


def detect_dataset_note(df: pd.DataFrame) -> str:
    # Label prototype results when the data looks small or lacks real target variety.
    if len(df) < 1000:
        return (
            "Prototype result warning: the dataset is very small, so these metrics "
            "should not be treated as real basketball accuracy."
        )

    if df[TARGET_COLUMN].nunique() < 2:
        return (
            "Prototype result warning: the target does not contain both made and "
            "missed shots, so evaluation is not a real accuracy estimate."
        )

    return (
        "Dataset note: this evaluation uses the provided normalized shot log dataset "
        "with a real made/missed target column. Shot zone and pressure are engineered "
        "features. If this dataset is replaced with synthetic or rule-generated data, "
        "treat the results as prototype results, not real basketball accuracy."
    )


def build_markdown_report(
    metadata: dict[str, Any],
    feature_names: list[str],
    shared_feature_mismatch: bool,
    dataset_note: str,
    confusion: list[list[int]],
    report_df: pd.DataFrame,
    roc_auc: float | None,
    feature_importance: pd.DataFrame,
    zone_summary: pd.DataFrame,
    pressure_summary: pd.DataFrame,
) -> str:
    # Assemble the complete evaluation report with metrics and interpretation notes.
    top_features = feature_importance.head(5)["feature"].tolist()
    strongest_feature = top_features[0] if top_features else "n/a"
    mismatch_note = (
        "Important integration warning: the saved model feature list does not match "
        "`backend/app/ml/feature_builder.py::MODEL_FEATURES`. Retrain the model before "
        "using it as the main backend predictor."
        if shared_feature_mismatch
        else "The saved model feature list matches the shared backend feature builder."
    )

    return f"""# ShotOptix XGBoost Model Evaluation

## Data And Integration Notes

- Model file: `{relative_markdown_path(MODEL_PATH)}`
- Dataset: `{relative_markdown_path(TRAINING_DATA_PATH)}`
- Test split: `{TEST_SIZE:.0%}` with `random_state={RANDOM_STATE}`
- Model metadata phase: `{metadata.get("phase", metadata.get("created_phase", "unknown"))}`
- {dataset_note}
- {mismatch_note}

## Confusion Matrix

Rows are actual labels and columns are predicted labels.

| Actual \\ Predicted | Miss (0) | Make (1) |
| --- | ---: | ---: |
| Miss (0) | {confusion[0][0]} | {confusion[0][1]} |
| Make (1) | {confusion[1][0]} | {confusion[1][1]} |

## Classification Report

{dataframe_to_markdown(report_df, ["precision", "recall", "f1-score"], ["support"])}

## ROC-AUC Score

ROC-AUC: `{format_float(roc_auc)}`

## Feature Importance

{dataframe_to_markdown(feature_importance, ["importance"])}

## Prediction Behavior By Shot Zone

{dataframe_to_markdown(zone_summary, ["actual_make_rate", "avg_predicted_make_probability", "predicted_make_rate_at_0.5", "roc_auc"], ["shots"])}

## Average Predicted Make Probability By Zone

{dataframe_to_markdown(zone_summary[["shot_zone", "avg_predicted_make_probability"]], ["avg_predicted_make_probability"])}

## Prediction Behavior By Pressure Level

{dataframe_to_markdown(pressure_summary, ["actual_make_rate", "avg_predicted_make_probability", "predicted_make_rate_at_0.5", "roc_auc"], ["shots"])}

## Average Predicted Make Probability By Pressure

{dataframe_to_markdown(pressure_summary[["pressure_level", "avg_predicted_make_probability"]], ["avg_predicted_make_probability"])}

## Notes

### What The Model Learned

The model learned broad relationships between shot context and made/missed outcomes. It uses distance, defender spacing, shot value, zone encodings, and pressure encodings to estimate the probability that a shot is made.

### Which Features Matter Most

The top feature by XGBoost importance is `{strongest_feature}`. The highest-ranked features in this run are: {", ".join(top_features) if top_features else "n/a"}.

### Where The Model May Be Weak

The model may be weak where groups have fewer shots, where engineered labels hide detail, or where important basketball context is missing. Current features do not include shooter identity, game context, exact court coordinates, release mechanics, lineup context, or defender quality.

### Why The Backend Still Needs Rule-Based Fallback

The backend still needs rule-based fallback because the model file can be missing, incompatible with the current feature builder, trained on prototype data, or asked to predict inputs outside the training distribution. Fallback keeps the API useful and stable instead of failing a live request.
"""


def main() -> None:
    # Load model metadata first because it defines the saved model feature contract.
    metadata = load_metadata()
    feature_names = list(metadata.get("features_used", SHARED_MODEL_FEATURES))
    shared_feature_mismatch = feature_names != list(SHARED_MODEL_FEATURES)

    # Load data, build features, and recreate the deterministic held-out split.
    df = load_dataset()
    X = build_features_for_model(df, feature_names)
    y = pd.to_numeric(df[TARGET_COLUMN], errors="coerce").astype(int)
    _, X_test, _, y_test, _, df_test = train_test_split(
        X,
        y,
        df,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    # Load the saved model and evaluate held-out predictions.
    model = joblib.load(MODEL_PATH)
    y_probability = pd.Series(
        get_positive_class_probabilities(model, X_test),
        index=X_test.index,
        name="predicted_make_probability",
    )
    y_pred = (y_probability >= 0.5).astype(int)

    confusion = confusion_matrix(y_test, y_pred, labels=[0, 1]).tolist()
    report = classification_report(
        y_test,
        y_pred,
        labels=[0, 1],
        output_dict=True,
        zero_division=0,
    )
    report_df = classification_report_to_dataframe(report)
    roc_auc = safe_roc_auc(y_test, y_probability)
    feature_importance = build_feature_importance(model, feature_names)

    # Join predictions back to original labels for zone and pressure comparisons.
    predictions = df_test[["shot_zone", "pressure_level"]].copy()
    predictions["actual_make"] = y_test
    predictions["predicted_make"] = y_pred
    predictions["predicted_make_probability"] = y_probability
    zone_summary = summarize_group_behavior(predictions, "shot_zone", SHOT_ZONES)
    pressure_summary = summarize_group_behavior(
        predictions,
        "pressure_level",
        PRESSURE_LEVELS,
    )

    dataset_note = detect_dataset_note(df)
    report_markdown = build_markdown_report(
        metadata=metadata,
        feature_names=feature_names,
        shared_feature_mismatch=shared_feature_mismatch,
        dataset_note=dataset_note,
        confusion=confusion,
        report_df=report_df,
        roc_auc=roc_auc,
        feature_importance=feature_importance,
        zone_summary=zone_summary,
        pressure_summary=pressure_summary,
    )

    REPORT_PATH.write_text(report_markdown, encoding="utf-8")

    print("ShotOptix XGBoost model evaluation complete")
    print("=" * 43)
    print(f"Report written to: {REPORT_PATH.relative_to(ROOT_DIR)}")
    print()
    print("Confusion matrix [[TN, FP], [FN, TP]]:")
    print(confusion)
    print()
    print(f"ROC-AUC: {format_float(roc_auc)}")
    print()
    print("Feature importance:")
    print(feature_importance.to_string(index=False))
    print()
    print("Prediction behavior by shot_zone:")
    print(zone_summary.to_string(index=False))
    print()
    print("Prediction behavior by pressure_level:")
    print(pressure_summary.to_string(index=False))
    print()
    print(dataset_note)
    if shared_feature_mismatch:
        print(
            "Integration warning: saved model features do not match "
            "backend/app/ml/feature_builder.py::MODEL_FEATURES."
        )


if __name__ == "__main__":
    main()
