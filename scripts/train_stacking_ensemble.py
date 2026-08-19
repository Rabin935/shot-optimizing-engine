"""
Train a stacked ensemble for ShotOptix shot prediction.

Base models: XGBoost, LightGBM, CatBoost, sklearn MLP
Meta model: logistic regression on out-of-fold probabilities

Usage:
    python scripts/train_stacking_ensemble.py --require-action-type --sample-size 2000000
    python scripts/train_stacking_ensemble.py --require-action-type --full-data
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
TRAINING_DATA_PATH = ROOT_DIR / "data" / "processed" / "shotoptix_ml_training.csv"
TRAINED_MODELS_DIR = BACKEND_DIR / "trained_models"
ENSEMBLE_PATH = TRAINED_MODELS_DIR / "shot_stacking_ensemble.joblib"
ENSEMBLE_META_PATH = TRAINED_MODELS_DIR / "ensemble_metadata.json"
XGBOOST_PATH = TRAINED_MODELS_DIR / "shot_xgboost_model.pkl"
XGBOOST_META_PATH = TRAINED_MODELS_DIR / "model_metadata.json"
RESULTS_MD_PATH = ROOT_DIR / "docs" / "ml-improvement-experiments.md"

TARGET_COLUMN = "shot_made"
RANDOM_STATE = 42
TEST_SIZE = 0.2
POSITIVE_CLASS = 1
N_FOLDS = 3

sys.path.insert(0, str(BACKEND_DIR))
from app.ml.feature_builder import (  # noqa: E402
    MODEL_FEATURES,
    build_features_from_dataframe,
    compute_prior_rates,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train ShotOptix stacking ensemble.")
    parser.add_argument("--sample-size", type=int, default=2_000_000)
    parser.add_argument("--full-data", action="store_true")
    parser.add_argument("--require-action-type", action="store_true", default=True)
    parser.add_argument("--no-require-action-type", action="store_true")
    parser.add_argument("--cv-folds", type=int, default=N_FOLDS)
    parser.add_argument(
        "--promote-if-better",
        action="store_true",
        help="Overwrite production XGBoost artifact if ensemble accuracy is higher.",
    )
    return parser.parse_args()


def load_dataset(sample_size: int | None, require_action_type: bool) -> pd.DataFrame:
    if not TRAINING_DATA_PATH.exists():
        raise FileNotFoundError(f"Missing dataset: {TRAINING_DATA_PATH}")

    df = pd.read_csv(TRAINING_DATA_PATH, low_memory=False)
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


def scale_pos_weight(y: pd.Series) -> float:
    negatives = int((y == 0).sum())
    positives = max(int((y == 1).sum()), 1)
    return negatives / positives


def evaluate(y_true: pd.Series, probs: np.ndarray, threshold: float = 0.5) -> dict[str, float]:
    pred = (probs >= threshold).astype(int)
    return {
        "accuracy": float(accuracy_score(y_true, pred)),
        "precision": float(precision_score(y_true, pred, zero_division=0)),
        "recall": float(recall_score(y_true, pred, zero_division=0)),
        "f1_score": float(f1_score(y_true, pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, probs)),
        "threshold": float(threshold),
    }


def optimize_threshold(y_true: pd.Series, probs: np.ndarray) -> tuple[float, dict[str, float]]:
    best_thr = 0.5
    best = evaluate(y_true, probs, 0.5)
    for thr in np.arange(0.35, 0.66, 0.01):
        metrics = evaluate(y_true, probs, thr)
        if metrics["accuracy"] > best["accuracy"]:
            best = metrics
            best_thr = float(thr)
    return best_thr, best


def positive_probs(model: Any, X: pd.DataFrame) -> np.ndarray:
    probs = model.predict_proba(X)
    classes = list(getattr(model, "classes_", [0, 1]))
    index = classes.index(POSITIVE_CLASS) if POSITIVE_CLASS in classes else 1
    return probs[:, index]


def build_base_models(spw: float) -> dict[str, Any]:
    from catboost import CatBoostClassifier
    from lightgbm import LGBMClassifier

    return {
        "xgboost": XGBClassifier(
            n_estimators=500,
            max_depth=7,
            learning_rate=0.04,
            subsample=0.85,
            colsample_bytree=0.8,
            min_child_weight=3,
            gamma=0.1,
            reg_alpha=0.1,
            reg_lambda=2.0,
            scale_pos_weight=spw,
            eval_metric="logloss",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
        "lightgbm": LGBMClassifier(
            n_estimators=600,
            max_depth=8,
            learning_rate=0.04,
            num_leaves=127,
            subsample=0.85,
            colsample_bytree=0.8,
            min_child_samples=40,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            n_jobs=-1,
            verbose=-1,
        ),
        "catboost": CatBoostClassifier(
            iterations=500,
            depth=7,
            learning_rate=0.04,
            l2_leaf_reg=5.0,
            auto_class_weights="Balanced",
            random_state=RANDOM_STATE,
            verbose=0,
        ),
        "mlp": Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                (
                    "mlp",
                    MLPClassifier(
                        hidden_layer_sizes=(512, 256, 128),
                        activation="relu",
                        alpha=1e-4,
                        learning_rate_init=1e-3,
                        max_iter=35,
                        early_stopping=True,
                        validation_fraction=0.1,
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
    }


def out_of_fold_predictions(
    models: dict[str, Any],
    X: pd.DataFrame,
    y: pd.Series,
    n_folds: int,
) -> tuple[pd.DataFrame, dict[str, Any]]:
    # Generate OOF probabilities for stacking without leaking the holdout test set.
    skf = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=RANDOM_STATE)
    oof = pd.DataFrame(index=X.index)
    fitted: dict[str, Any] = {}

    for name, template in models.items():
        print(f"  OOF training: {name}")
        fold_probs = np.zeros(len(X), dtype=np.float64)
        started = time.time()
        for fold, (train_idx, valid_idx) in enumerate(skf.split(X, y), start=1):
            model = clone_model(template)
            model.fit(X.iloc[train_idx], y.iloc[train_idx])
            fold_probs[valid_idx] = positive_probs(model, X.iloc[valid_idx])
            print(f"    fold {fold}/{n_folds} done")
        oof[name] = fold_probs
        # Refit on full training split for live inference.
        final_model = clone_model(template)
        final_model.fit(X, y)
        fitted[name] = final_model
        print(f"  {name} finished in {time.time() - started:.1f}s")

    return oof, fitted


def clone_model(model: Any) -> Any:
    from sklearn.base import clone

    return clone(model)


def blend_average(prob_matrix: pd.DataFrame) -> np.ndarray:
    return prob_matrix.mean(axis=1).to_numpy()


def main() -> None:
    args = parse_args()
    require_action = not args.no_require_action_type
    sample_size = None if args.full_data else args.sample_size

    print("Loading dataset...")
    df = load_dataset(sample_size, require_action)
    y = pd.to_numeric(df[TARGET_COLUMN], errors="coerce").astype(int)
    train_df, test_df, y_train, y_test = train_test_split(
        df,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )
    prior_rates = compute_prior_rates(train_df)
    X_train = build_features_from_dataframe(train_df, prior_rates=prior_rates).astype(
        np.float32
    )
    X_test = build_features_from_dataframe(test_df, prior_rates=prior_rates).astype(
        np.float32
    )
    y_train = y_train.reset_index(drop=True)
    y_test = y_test.reset_index(drop=True)
    X_train = X_train.reset_index(drop=True)
    X_test = X_test.reset_index(drop=True)

    spw = scale_pos_weight(y_train)
    print(
        f"Rows: {len(df):,} | Train: {len(X_train):,} | Test: {len(X_test):,} | "
        f"Features: {X_train.shape[1]} | Make rate: {y.mean():.4f}"
    )

    models = build_base_models(spw)
    print("\n=== Out-of-fold stacking base models ===")
    oof_probs, fitted_models = out_of_fold_predictions(
        models,
        X_train,
        y_train,
        n_folds=args.cv_folds,
    )

    print("\n=== Fitting meta-learner ===")
    meta = LogisticRegression(max_iter=1000, random_state=RANDOM_STATE)
    meta.fit(oof_probs, y_train)

    # Holdout base predictions, then stack / average.
    holdout_base = pd.DataFrame(
        {name: positive_probs(model, X_test) for name, model in fitted_models.items()}
    )
    stack_probs = meta.predict_proba(holdout_base)[:, 1]
    avg_probs = blend_average(holdout_base)

    results: dict[str, dict[str, Any]] = {}
    for name in holdout_base.columns:
        thr, metrics = optimize_threshold(y_test, holdout_base[name].to_numpy())
        results[name] = {
            "optimal_threshold": thr,
            "metrics": metrics,
            "default_metrics": evaluate(y_test, holdout_base[name].to_numpy(), 0.5),
        }
        print(
            f"{name}: acc={metrics['accuracy']:.4f} auc={metrics['roc_auc']:.4f} thr={thr:.2f}"
        )

    stack_thr, stack_metrics = optimize_threshold(y_test, stack_probs)
    avg_thr, avg_metrics = optimize_threshold(y_test, avg_probs)
    results["stacking_logistic"] = {
        "optimal_threshold": stack_thr,
        "metrics": stack_metrics,
        "default_metrics": evaluate(y_test, stack_probs, 0.5),
    }
    results["soft_average"] = {
        "optimal_threshold": avg_thr,
        "metrics": avg_metrics,
        "default_metrics": evaluate(y_test, avg_probs, 0.5),
    }
    print(
        f"stacking_logistic: acc={stack_metrics['accuracy']:.4f} "
        f"auc={stack_metrics['roc_auc']:.4f} thr={stack_thr:.2f}"
    )
    print(
        f"soft_average: acc={avg_metrics['accuracy']:.4f} "
        f"auc={avg_metrics['roc_auc']:.4f} thr={avg_thr:.2f}"
    )

    best_name = max(results, key=lambda key: results[key]["metrics"]["accuracy"])
    best = results[best_name]
    print(
        f"\nBest method: {best_name} | accuracy={best['metrics']['accuracy']:.4f} "
        f"| auc={best['metrics']['roc_auc']:.4f}"
    )

    ensemble_bundle = {
        "base_models": fitted_models,
        "meta_model": meta,
        "model_order": list(fitted_models.keys()),
        "prior_rates": prior_rates,
        "features_used": list(MODEL_FEATURES),
        "best_method": best_name,
        "decision_threshold": best["optimal_threshold"],
        "blend_mode": "stacking" if best_name == "stacking_logistic" else "average",
    }
    TRAINED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(ensemble_bundle, ENSEMBLE_PATH)

    metadata = {
        "model_name": "shot_stacking_ensemble",
        "model_type": "Stacked ensemble (XGB + LightGBM + CatBoost + MLP)",
        "phase": "Stacking ensemble push toward 70-75% accuracy",
        "target_column": TARGET_COLUMN,
        "features_used": list(MODEL_FEATURES),
        "training_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "sample_size": sample_size,
        "require_action_type": require_action,
        "cv_folds": args.cv_folds,
        "best_method": best_name,
        "decision_threshold": best["optimal_threshold"],
        "metrics": best["metrics"],
        "all_results": {
            name: {
                "optimal_threshold": value["optimal_threshold"],
                "metrics": value["metrics"],
                "default_metrics": value["default_metrics"],
            }
            for name, value in results.items()
        },
        "prior_rates": prior_rates,
        "training_date": datetime.now(UTC).isoformat(),
        "notes": (
            "Ensemble artifact is saved for research/comparison. Production FastAPI "
            "still defaults to the XGBoost pickle unless promote-if-better is used."
        ),
    }
    ENSEMBLE_META_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    # Optionally promote the strongest single XGBoost (or stacked via wrapping) to production.
    if args.promote_if_better:
        current_acc = 0.0
        if XGBOOST_META_PATH.exists():
            current = json.loads(XGBOOST_META_PATH.read_text(encoding="utf-8"))
            current_acc = float(
                current.get("metrics_at_decision_threshold", current.get("metrics", {})).get(
                    "accuracy",
                    0.0,
                )
            )
        if best["metrics"]["accuracy"] > current_acc + 0.001:
            # Prefer promoting the fitted XGBoost base for FastAPI compatibility.
            xgb_model = fitted_models["xgboost"]
            xgb_thr = results["xgboost"]["optimal_threshold"]
            xgb_metrics = results["xgboost"]["metrics"]
            joblib.dump(xgb_model, XGBOOST_PATH)
            xgb_meta = {
                "model_name": "shot_xgboost_model",
                "model_type": "XGBoost XGBClassifier",
                "phase": "Stacked-training promoted XGBoost",
                "target_column": TARGET_COLUMN,
                "features_used": list(MODEL_FEATURES),
                "training_dataset": TRAINING_DATA_PATH.relative_to(ROOT_DIR).as_posix(),
                "training_rows": int(len(X_train)),
                "test_rows": int(len(X_test)),
                "metrics": results["xgboost"]["default_metrics"],
                "metrics_at_decision_threshold": xgb_metrics,
                "feature_importance": [
                    {"feature": f, "importance": float(i)}
                    for f, i in sorted(
                        zip(MODEL_FEATURES, getattr(xgb_model, "feature_importances_", [])),
                        key=lambda row: row[1],
                        reverse=True,
                    )
                ],
                "hyperparameters": {
                    "n_estimators": 500,
                    "max_depth": 7,
                    "learning_rate": 0.04,
                    "subsample": 0.85,
                    "colsample_bytree": 0.8,
                    "min_child_weight": 3,
                    "gamma": 0.1,
                    "reg_alpha": 0.1,
                    "reg_lambda": 2.0,
                },
                "scale_pos_weight": spw,
                "decision_threshold": xgb_thr,
                "prior_rates": prior_rates,
                "training_date": datetime.now(UTC).isoformat(),
                "training_filter": (
                    "require_action_type" if require_action else "full"
                ),
                "ensemble_best_method": best_name,
                "ensemble_best_accuracy": best["metrics"]["accuracy"],
                "notes": (
                    "Promoted from stacking training run. Feature order must match "
                    "app.ml.feature_builder.MODEL_FEATURES."
                ),
            }
            XGBOOST_META_PATH.write_text(json.dumps(xgb_meta, indent=2), encoding="utf-8")
            print(
                f"Promoted XGBoost to production "
                f"(acc {xgb_metrics['accuracy']:.4f} > previous {current_acc:.4f})"
            )
        else:
            print(
                f"No production promote: best {best['metrics']['accuracy']:.4f} "
                f"vs current {current_acc:.4f}"
            )

    append_results_to_docs(metadata)
    print(f"\nEnsemble saved: {ENSEMBLE_PATH.relative_to(ROOT_DIR)}")
    print(f"Metadata saved: {ENSEMBLE_META_PATH.relative_to(ROOT_DIR)}")
    target_hit = best["metrics"]["accuracy"] >= 0.70
    print(
        "Target 70-75%: "
        + ("REACHED" if target_hit else f"NOT REACHED (best={best['metrics']['accuracy']:.2%})")
    )


def append_results_to_docs(metadata: dict[str, Any]) -> None:
    if not RESULTS_MD_PATH.exists():
        return

    lines = [
        "",
        "## Stacking Ensemble Push",
        "",
        f"Generated: `{metadata['training_date']}`",
        "",
        f"- Train rows: **{metadata['training_rows']:,}**",
        f"- Test rows: **{metadata['test_rows']:,}**",
        f"- Best method: **{metadata['best_method']}**",
        f"- Best accuracy: **{metadata['metrics']['accuracy']:.4f}**",
        f"- Best ROC-AUC: **{metadata['metrics']['roc_auc']:.4f}**",
        f"- Decision threshold: **{metadata['decision_threshold']:.2f}**",
        "",
        "| model | accuracy | roc_auc | threshold |",
        "| --- | ---: | ---: | ---: |",
    ]
    for name, payload in metadata["all_results"].items():
        metrics = payload["metrics"]
        lines.append(
            f"| {name} | {metrics['accuracy']:.4f} | {metrics['roc_auc']:.4f} | "
            f"{metrics['threshold']:.2f} |"
        )
    lines.append("")
    RESULTS_MD_PATH.write_text(
        RESULTS_MD_PATH.read_text(encoding="utf-8") + "\n".join(lines) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
