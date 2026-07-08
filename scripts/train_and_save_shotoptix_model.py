import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier


ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
TRAINING_DATA_PATH = ROOT_DIR / "data" / "processed" / "shotoptix_ml_training.csv"
TRAINED_MODELS_DIR = BACKEND_DIR / "trained_models"
MODEL_PATH = TRAINED_MODELS_DIR / "shot_xgboost_model.pkl"
METADATA_PATH = TRAINED_MODELS_DIR / "model_metadata.json"

TARGET_COLUMN = "shot_made"
MODEL_NAME = "shot_xgboost_model"
PHASE = "Step 6 - Save Trained ShotOptix XGBoost Model"
TEST_SIZE = 0.2
RANDOM_STATE = 42
POSITIVE_CLASS = 1

# Allow this script to reuse backend feature preparation exactly as FastAPI does.
sys.path.insert(0, str(BACKEND_DIR))
from app.ml.feature_builder import MODEL_FEATURES, build_features_from_dataframe  # noqa: E402


def load_training_dataset() -> pd.DataFrame:
    # Load the normalized ML dataset produced by normalize_shotoptix_training_data.py.
    if not TRAINING_DATA_PATH.exists():
        raise FileNotFoundError(f"Training dataset not found: {TRAINING_DATA_PATH}")

    df = pd.read_csv(TRAINING_DATA_PATH, low_memory=False)
    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Training dataset must contain {TARGET_COLUMN}.")

    return df


def build_model() -> XGBClassifier:
    # Keep model settings explicit so future retraining is reproducible.
    return XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="logloss",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )


def positive_class_probabilities(model: XGBClassifier, X_test: pd.DataFrame) -> list[float]:
    # predict_proba returns one column per class, so select the made-shot class.
    probabilities = model.predict_proba(X_test)
    classes = list(getattr(model, "classes_", [0, 1]))

    if POSITIVE_CLASS in classes:
        positive_class_index = classes.index(POSITIVE_CLASS)
    else:
        positive_class_index = 1

    return probabilities[:, positive_class_index].tolist()


def calculate_metrics(
    y_test: pd.Series,
    y_pred: pd.Series,
    y_probability: pd.Series,
) -> dict[str, float]:
    # Store standard classification metrics for model review and metadata display.
    return {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_probability)),
    }


def build_feature_importance(model: XGBClassifier) -> list[dict[str, float | str]]:
    # Save feature importance so later reports can explain what the model used most.
    importances = getattr(model, "feature_importances_", [])
    rows = [
        {
            "feature": feature,
            "importance": float(importance),
        }
        for feature, importance in zip(MODEL_FEATURES, importances)
    ]

    return sorted(rows, key=lambda row: float(row["importance"]), reverse=True)


def build_metadata(
    training_rows: int,
    test_rows: int,
    metrics: dict[str, float],
    feature_importance: list[dict[str, float | str]],
) -> dict[str, Any]:
    # Metadata documents the saved artifact so backend and notebooks know its contract.
    return {
        "model_name": MODEL_NAME,
        "model_type": "XGBoost XGBClassifier",
        "phase": PHASE,
        "target_column": TARGET_COLUMN,
        "features_used": list(MODEL_FEATURES),
        "training_dataset": TRAINING_DATA_PATH.relative_to(ROOT_DIR).as_posix(),
        "training_rows": training_rows,
        "test_rows": test_rows,
        "metrics": metrics,
        "feature_importance": feature_importance,
        "training_date": datetime.now(UTC).isoformat(),
        "notes": (
            "Feature order is exactly the order in features_used and must match "
            "app.ml.feature_builder.MODEL_FEATURES during FastAPI inference. "
            "The backend rule-based fallback remains required when the model is "
            "missing, incompatible, or unable to predict safely."
        ),
    }


def save_model_and_metadata(model: XGBClassifier, metadata: dict[str, Any]) -> None:
    # Ensure the output directory exists before writing model artifacts.
    TRAINED_MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # joblib saves the trained sklearn-compatible XGBoost model for FastAPI loading.
    joblib.dump(model, MODEL_PATH)

    # JSON metadata keeps model diagnostics readable without loading the pickle file.
    METADATA_PATH.write_text(
        json.dumps(metadata, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    # Load normalized data and convert it through the shared backend feature builder.
    df = load_training_dataset()
    X = build_features_from_dataframe(df)
    y = pd.to_numeric(df[TARGET_COLUMN], errors="coerce").astype(int)

    # Split into train/test sets so saved metadata reports held-out performance.
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    # Fit the XGBoost model on the shared feature format.
    model = build_model()
    model.fit(X_train, y_train)

    # Evaluate the held-out test split before saving the artifact.
    y_probability = pd.Series(positive_class_probabilities(model, X_test), index=X_test.index)
    y_pred = (y_probability >= 0.5).astype(int)
    metrics = calculate_metrics(y_test, y_pred, y_probability)
    feature_importance = build_feature_importance(model)

    # Save both the loadable model and the metadata FastAPI/model-info can read later.
    metadata = build_metadata(
        training_rows=int(len(X_train)),
        test_rows=int(len(X_test)),
        metrics=metrics,
        feature_importance=feature_importance,
    )
    save_model_and_metadata(model, metadata)

    print("ShotOptix model training and save complete")
    print("=" * 43)
    print(f"Model saved to: {MODEL_PATH.relative_to(ROOT_DIR)}")
    print(f"Metadata saved to: {METADATA_PATH.relative_to(ROOT_DIR)}")
    print(f"Training rows: {len(X_train)}")
    print(f"Test rows: {len(X_test)}")
    print(f"Features used: {list(MODEL_FEATURES)}")
    print("Metrics:")
    for metric, value in metrics.items():
        print(f"  {metric}: {value:.4f}")


if __name__ == "__main__":
    main()
