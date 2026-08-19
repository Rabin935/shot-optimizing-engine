import argparse
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
EXPERIMENT_RESULTS_PATH = ROOT_DIR / "data" / "processed" / "ml_experiment_results.json"
TRAINED_MODELS_DIR = BACKEND_DIR / "trained_models"
MODEL_PATH = TRAINED_MODELS_DIR / "shot_xgboost_model.pkl"
METADATA_PATH = TRAINED_MODELS_DIR / "model_metadata.json"

TARGET_COLUMN = "shot_made"
MODEL_NAME = "shot_xgboost_model"
PHASE = "Step 6 - Save Trained ShotOptix XGBoost Model (Tuned)"
TEST_SIZE = 0.2
RANDOM_STATE = 42
POSITIVE_CLASS = 1

DEFAULT_HYPERPARAMETERS = {
    "n_estimators": 400,
    "max_depth": 6,
    "learning_rate": 0.05,
    "subsample": 0.85,
    "colsample_bytree": 0.8,
    "min_child_weight": 3,
    "gamma": 0.1,
    "reg_alpha": 0.1,
    "reg_lambda": 2.0,
}

# Allow this script to reuse backend feature preparation exactly as FastAPI does.
sys.path.insert(0, str(BACKEND_DIR))
from app.ml.feature_builder import (  # noqa: E402
    MODEL_FEATURES,
    build_features_from_dataframe,
    compute_prior_rates,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train and save the ShotOptix model.")
    parser.add_argument(
        "--sample-size",
        type=int,
        default=None,
        help="Optional stratified sample size for faster training.",
    )
    parser.add_argument(
        "--require-action-type",
        action="store_true",
        help="Train only on rows with a non-empty action_type.",
    )
    return parser.parse_args()


def load_training_dataset(
    sample_size: int | None = None,
    require_action_type: bool = False,
) -> pd.DataFrame:
    # Load the normalized ML dataset produced by normalize_shotoptix_training_data.py.
    if not TRAINING_DATA_PATH.exists():
        raise FileNotFoundError(f"Training dataset not found: {TRAINING_DATA_PATH}")

    df = pd.read_csv(TRAINING_DATA_PATH, low_memory=False)
    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Training dataset must contain {TARGET_COLUMN}.")

    if require_action_type and "action_type" in df.columns:
        df = df[df["action_type"].fillna("").astype(str).str.len() > 0].copy()

    if sample_size is not None and len(df) > sample_size:
        df, _ = train_test_split(
            df,
            train_size=sample_size,
            random_state=RANDOM_STATE,
            stratify=df[TARGET_COLUMN],
        )

    return df.reset_index(drop=True)


def compute_scale_pos_weight(y: pd.Series) -> float:
    negatives = int((y == 0).sum())
    positives = int((y == 1).sum())
    if positives == 0:
        return 1.0
    return negatives / positives


def load_tuned_hyperparameters() -> tuple[dict[str, Any], float | None]:
    # Reuse the best tuned XGBoost settings when experiment results are available.
    if not EXPERIMENT_RESULTS_PATH.exists():
        return DEFAULT_HYPERPARAMETERS.copy(), None

    try:
        experiment = json.loads(EXPERIMENT_RESULTS_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return DEFAULT_HYPERPARAMETERS.copy(), None

    best_model = experiment.get("best_model", {})
    if best_model.get("model_name") != "xgboost":
        for model in experiment.get("models", []):
            if model.get("model_name") == "xgboost":
                return model.get("best_params", DEFAULT_HYPERPARAMETERS.copy()), model.get(
                    "optimal_threshold"
                )

    return best_model.get("best_params", DEFAULT_HYPERPARAMETERS.copy()), best_model.get(
        "optimal_threshold"
    )


def build_model(scale_pos_weight: float, hyperparameters: dict[str, Any]) -> XGBClassifier:
    # Keep model settings explicit so future retraining is reproducible.
    return XGBClassifier(
        **hyperparameters,
        eval_metric="logloss",
        random_state=RANDOM_STATE,
        n_jobs=-1,
        scale_pos_weight=scale_pos_weight,
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
    metrics_at_decision_threshold: dict[str, float],
    feature_importance: list[dict[str, float | str]],
    hyperparameters: dict[str, Any],
    scale_pos_weight: float,
    decision_threshold: float,
    prior_rates: dict[str, Any],
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
        "metrics_at_decision_threshold": metrics_at_decision_threshold,
        "feature_importance": feature_importance,
        "hyperparameters": hyperparameters,
        "scale_pos_weight": scale_pos_weight,
        "decision_threshold": decision_threshold,
        "prior_rates": prior_rates,
        "training_date": datetime.now(UTC).isoformat(),
        "notes": (
            "Feature order is exactly the order in features_used and must match "
            "app.ml.feature_builder.MODEL_FEATURES during FastAPI inference. "
            "Metrics are reported at threshold 0.5 for API compatibility; "
            "decision_threshold stores the tuned value from experiments when available. "
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
    args = parse_args()

    # Load normalized data and convert it through the shared backend feature builder.
    df = load_training_dataset(
        sample_size=args.sample_size,
        require_action_type=args.require_action_type,
    )
    y = pd.to_numeric(df[TARGET_COLUMN], errors="coerce").astype(int)
    scale_pos_weight = compute_scale_pos_weight(y)
    hyperparameters, tuned_threshold = load_tuned_hyperparameters()
    decision_threshold = float(tuned_threshold) if tuned_threshold is not None else 0.5

    train_df, test_df, y_train, y_test = train_test_split(
        df,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )
    prior_rates = compute_prior_rates(train_df)
    X_train = build_features_from_dataframe(train_df, prior_rates=prior_rates)
    X_test = build_features_from_dataframe(test_df, prior_rates=prior_rates)

    # Fit the XGBoost model on the shared feature format.
    model = build_model(scale_pos_weight, hyperparameters)
    model.fit(X_train, y_train)

    # Evaluate the held-out test split before saving the artifact.
    y_probability = pd.Series(positive_class_probabilities(model, X_test), index=X_test.index)
    y_pred = (y_probability >= 0.5).astype(int)
    metrics = calculate_metrics(y_test, y_pred, y_probability)
    y_pred_tuned = (y_probability >= decision_threshold).astype(int)
    metrics_at_decision_threshold = calculate_metrics(y_test, y_pred_tuned, y_probability)
    metrics_at_decision_threshold["threshold"] = decision_threshold
    feature_importance = build_feature_importance(model)

    # Save both the loadable model and the metadata FastAPI/model-info can read later.
    metadata = build_metadata(
        training_rows=int(len(X_train)),
        test_rows=int(len(X_test)),
        metrics=metrics,
        metrics_at_decision_threshold=metrics_at_decision_threshold,
        feature_importance=feature_importance,
        hyperparameters=hyperparameters,
        scale_pos_weight=scale_pos_weight,
        decision_threshold=decision_threshold,
        prior_rates=prior_rates,
    )
    save_model_and_metadata(model, metadata)

    print("ShotOptix model training and save complete")
    print("=" * 43)
    print(f"Model saved to: {MODEL_PATH.relative_to(ROOT_DIR)}")
    print(f"Metadata saved to: {METADATA_PATH.relative_to(ROOT_DIR)}")
    print(f"Training rows: {len(X_train)}")
    print(f"Test rows: {len(X_test)}")
    print(f"Features used: {len(MODEL_FEATURES)}")
    print(f"scale_pos_weight: {scale_pos_weight:.4f}")
    print(f"Tuned decision threshold (metadata): {decision_threshold:.2f}")
    print("Hyperparameters:")
    for key, value in hyperparameters.items():
        print(f"  {key}: {value}")
    print("Metrics (threshold=0.5):")
    for metric, value in metrics.items():
        print(f"  {metric}: {value:.4f}")
    print(f"Metrics (threshold={decision_threshold:.2f}):")
    for metric, value in metrics_at_decision_threshold.items():
        if isinstance(value, float):
            print(f"  {metric}: {value:.4f}")


if __name__ == "__main__":
    main()
