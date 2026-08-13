"""
Train a deep tabular neural network (PyTorch, entity embeddings) for ShotOptix
shot prediction and compare it against the production XGBoost model.

Unlike the earlier sklearn MLPClassifier experiment (CPU, shallow, no
embeddings), this trains a deeper network with learned embeddings for
player_id and action_type on GPU (if available), using the full normalized
dataset rather than a capped sample.

Usage:
    python scripts/train_deep_shot_model.py
    python scripts/train_deep_shot_model.py --sample-size 3000000 --epochs 25
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import torch
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
TRAINING_DATA_PATH = ROOT_DIR / "data" / "processed" / "shotoptix_ml_training.csv"
TRAINED_MODELS_DIR = BACKEND_DIR / "trained_models"
MODEL_PATH = TRAINED_MODELS_DIR / "shot_deep_model.pt"
METADATA_PATH = TRAINED_MODELS_DIR / "deep_model_metadata.json"
XGBOOST_METADATA_PATH = TRAINED_MODELS_DIR / "model_metadata.json"
RESULTS_MD_PATH = ROOT_DIR / "docs" / "ml-improvement-experiments.md"

TARGET_COLUMN = "shot_made"
MODEL_NAME = "shot_deep_model"
RANDOM_STATE = 42
TEST_SIZE = 0.2
VAL_SIZE = 0.1  # fraction of the remaining train split
OOV_INDEX = 0  # reserved index for unknown / missing categorical values

sys.path.insert(0, str(BACKEND_DIR))
from app.ml.feature_builder import (  # noqa: E402
    MODEL_FEATURES,
    DEFAULT_ACTION_TYPE,
    build_features_from_dataframe,
    compute_prior_rates,
    normalize_text,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train the ShotOptix deep tabular model.")
    parser.add_argument("--sample-size", type=int, default=None, help="Optional stratified sample size.")
    parser.add_argument("--epochs", type=int, default=40)
    parser.add_argument("--batch-size", type=int, default=4096)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--patience", type=int, default=6, help="Early stopping patience (epochs).")
    parser.add_argument("--player-embed-dim", type=int, default=16)
    parser.add_argument("--action-embed-dim", type=int, default=8)
    parser.add_argument(
        "--hidden-dims",
        type=str,
        default="256,128,64",
        help="Comma-separated block widths, e.g. 512,256,128.",
    )
    parser.add_argument(
        "--scheduler",
        choices=["plateau", "onecycle"],
        default="plateau",
        help="plateau halves LR on AUC stall; onecycle ramps up then anneals across all epochs.",
    )
    parser.add_argument("--weight-decay", type=float, default=1e-5)
    return parser.parse_args()


def load_training_dataset(sample_size: int | None) -> pd.DataFrame:
    if not TRAINING_DATA_PATH.exists():
        raise FileNotFoundError(f"Training dataset not found: {TRAINING_DATA_PATH}")

    df = pd.read_csv(TRAINING_DATA_PATH, low_memory=False)
    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Training dataset must contain {TARGET_COLUMN}.")

    if sample_size is not None and len(df) > sample_size:
        df, _ = train_test_split(
            df,
            train_size=sample_size,
            random_state=RANDOM_STATE,
            stratify=df[TARGET_COLUMN],
        )

    return df.reset_index(drop=True)


def build_vocab(values: pd.Series) -> dict[str, int]:
    # Index 0 is reserved for unseen/out-of-vocabulary values at inference time.
    unique_values = sorted(values.dropna().astype(str).unique().tolist())
    return {value: index + 1 for index, value in enumerate(unique_values)}


def encode_with_vocab(values: pd.Series, vocab: dict[str, int]) -> np.ndarray:
    return values.astype(str).map(lambda v: vocab.get(v, OOV_INDEX)).to_numpy(dtype=np.int64)


class DeepShotModel(nn.Module):
    def __init__(
        self,
        num_numeric_features: int,
        num_players: int,
        num_actions: int,
        player_embed_dim: int,
        action_embed_dim: int,
        hidden_dims: tuple[int, int, int] = (256, 128, 64),
    ) -> None:
        super().__init__()
        self.player_embedding = nn.Embedding(num_players + 1, player_embed_dim, padding_idx=OOV_INDEX)
        self.action_embedding = nn.Embedding(num_actions + 1, action_embed_dim, padding_idx=OOV_INDEX)

        input_dim = num_numeric_features + player_embed_dim + action_embed_dim
        dim1, dim2, dim3 = hidden_dims

        def block(in_dim: int, out_dim: int, dropout: float) -> nn.Sequential:
            return nn.Sequential(
                nn.Linear(in_dim, out_dim),
                nn.BatchNorm1d(out_dim),
                nn.ReLU(),
                nn.Dropout(dropout),
            )

        self.block1 = block(input_dim, dim1, 0.30)
        self.block2 = block(dim1, dim2, 0.30)
        self.block3 = block(dim2 + dim1, dim3, 0.20)  # skip connection from block1
        self.output_layer = nn.Linear(dim3, 1)

    def forward(
        self,
        numeric: torch.Tensor,
        player_idx: torch.Tensor,
        action_idx: torch.Tensor,
    ) -> torch.Tensor:
        player_vec = self.player_embedding(player_idx)
        action_vec = self.action_embedding(action_idx)
        x = torch.cat([numeric, player_vec, action_vec], dim=1)

        h1 = self.block1(x)
        h2 = self.block2(h1)
        h3 = self.block3(torch.cat([h1, h2], dim=1))
        return self.output_layer(h3).squeeze(-1)


def to_tensors(
    features: pd.DataFrame,
    player_idx: np.ndarray,
    action_idx: np.ndarray,
    mean: np.ndarray,
    std: np.ndarray,
) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
    # Kept on CPU deliberately: the full dataset does not fit alongside model
    # activations on a 4GB GPU. Batches are moved to device just-in-time.
    numeric = (features.to_numpy(dtype=np.float32) - mean) / std
    return (
        torch.from_numpy(numeric.copy()),
        torch.from_numpy(player_idx.copy()),
        torch.from_numpy(action_idx.copy()),
    )


def evaluate(
    model: DeepShotModel,
    numeric: torch.Tensor,
    player_idx: torch.Tensor,
    action_idx: torch.Tensor,
    y_true: np.ndarray,
    batch_size: int,
    device: torch.device,
) -> tuple[np.ndarray, dict[str, float]]:
    model.eval()
    probs = []
    with torch.no_grad():
        for start in range(0, numeric.shape[0], batch_size):
            end = start + batch_size
            logits = model(
                numeric[start:end].to(device, non_blocking=True),
                player_idx[start:end].to(device, non_blocking=True),
                action_idx[start:end].to(device, non_blocking=True),
            )
            probs.append(torch.sigmoid(logits).cpu().numpy())
    y_prob = np.concatenate(probs)
    y_pred = (y_prob >= 0.5).astype(int)
    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_true, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, y_prob)),
    }
    return y_prob, metrics


def sweep_threshold(y_true: np.ndarray, y_prob: np.ndarray) -> tuple[float, dict[str, float]]:
    best_threshold = 0.5
    best_accuracy = -1.0
    best_metrics: dict[str, float] = {}
    for threshold in np.arange(0.35, 0.66, 0.01):
        y_pred = (y_prob >= threshold).astype(int)
        accuracy = accuracy_score(y_true, y_pred)
        if accuracy > best_accuracy:
            best_accuracy = accuracy
            best_threshold = float(threshold)
            best_metrics = {
                "accuracy": float(accuracy),
                "precision": float(precision_score(y_true, y_pred, zero_division=0)),
                "recall": float(recall_score(y_true, y_pred, zero_division=0)),
                "f1_score": float(f1_score(y_true, y_pred, zero_division=0)),
                "roc_auc": float(roc_auc_score(y_true, y_prob)),
            }
    return best_threshold, best_metrics


def main() -> None:
    args = parse_args()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    if device.type == "cuda":
        print(f"GPU: {torch.cuda.get_device_name(0)}")

    start_time = time.time()
    df = load_training_dataset(args.sample_size)
    print(f"Loaded {len(df):,} rows in {time.time() - start_time:.1f}s")

    y = pd.to_numeric(df[TARGET_COLUMN], errors="coerce").astype(int)

    train_df, test_df, y_train, y_test = train_test_split(
        df, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    train_df, val_df, y_train, y_val = train_test_split(
        train_df, y_train, test_size=VAL_SIZE, random_state=RANDOM_STATE, stratify=y_train
    )
    print(f"Train: {len(train_df):,}  Val: {len(val_df):,}  Test: {len(test_df):,}")

    prior_rates = compute_prior_rates(train_df)

    print("Building engineered features...")
    build_start = time.time()
    X_train = build_features_from_dataframe(train_df, prior_rates=prior_rates)
    X_val = build_features_from_dataframe(val_df, prior_rates=prior_rates)
    X_test = build_features_from_dataframe(test_df, prior_rates=prior_rates)
    print(f"Feature build done in {time.time() - build_start:.1f}s")

    player_series_train = (
        train_df["player_id"].astype(str) if "player_id" in train_df.columns else pd.Series("unknown", index=train_df.index)
    )
    action_series_train = (
        train_df["action_type"].fillna(DEFAULT_ACTION_TYPE).apply(normalize_text)
        if "action_type" in train_df.columns
        else pd.Series(DEFAULT_ACTION_TYPE, index=train_df.index)
    )
    player_vocab = build_vocab(player_series_train)
    action_vocab = build_vocab(action_series_train)
    print(f"Player vocab size: {len(player_vocab)}  Action vocab size: {len(action_vocab)}")

    def player_action_indices(source_df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
        players = source_df["player_id"].astype(str) if "player_id" in source_df.columns else pd.Series("unknown", index=source_df.index)
        actions = (
            source_df["action_type"].fillna(DEFAULT_ACTION_TYPE).apply(normalize_text)
            if "action_type" in source_df.columns
            else pd.Series(DEFAULT_ACTION_TYPE, index=source_df.index)
        )
        return encode_with_vocab(players, player_vocab), encode_with_vocab(actions, action_vocab)

    player_idx_train, action_idx_train = player_action_indices(train_df)
    player_idx_val, action_idx_val = player_action_indices(val_df)
    player_idx_test, action_idx_test = player_action_indices(test_df)

    mean = X_train.to_numpy(dtype=np.float32).mean(axis=0)
    std = X_train.to_numpy(dtype=np.float32).std(axis=0)
    std[std < 1e-6] = 1.0

    numeric_train, player_t_train, action_t_train = to_tensors(X_train, player_idx_train, action_idx_train, mean, std)
    numeric_val, player_t_val, action_t_val = to_tensors(X_val, player_idx_val, action_idx_val, mean, std)
    numeric_test, player_t_test, action_t_test = to_tensors(X_test, player_idx_test, action_idx_test, mean, std)

    y_train_t = torch.from_numpy(y_train.to_numpy(dtype=np.float32).copy())

    dataset = TensorDataset(numeric_train, player_t_train, action_t_train, y_train_t)
    pin_memory = device.type == "cuda"
    loader = DataLoader(dataset, batch_size=args.batch_size, shuffle=True, drop_last=False, pin_memory=pin_memory)

    hidden_dims = tuple(int(x) for x in args.hidden_dims.split(","))
    if len(hidden_dims) != 3:
        raise ValueError("--hidden-dims must have exactly 3 comma-separated widths")

    model = DeepShotModel(
        num_numeric_features=X_train.shape[1],
        num_players=len(player_vocab),
        num_actions=len(action_vocab),
        player_embed_dim=args.player_embed_dim,
        action_embed_dim=args.action_embed_dim,
        hidden_dims=hidden_dims,
    ).to(device)
    print(f"Architecture: hidden_dims={hidden_dims} player_embed={args.player_embed_dim} action_embed={args.action_embed_dim}")

    negatives = int((y_train == 0).sum())
    positives = int((y_train == 1).sum())
    pos_weight = torch.tensor([negatives / max(positives, 1)], dtype=torch.float32, device=device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)

    steps_per_epoch = (len(dataset) + args.batch_size - 1) // args.batch_size
    if args.scheduler == "onecycle":
        scheduler = torch.optim.lr_scheduler.OneCycleLR(
            optimizer, max_lr=args.lr, epochs=args.epochs, steps_per_epoch=steps_per_epoch
        )
        step_scheduler_per_batch = True
    else:
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=2)
        step_scheduler_per_batch = False

    best_val_auc = -1.0
    best_state = None
    epochs_without_improvement = 0

    print("Training...")
    for epoch in range(1, args.epochs + 1):
        model.train()
        epoch_start = time.time()
        total_loss = 0.0
        for numeric_batch, player_batch, action_batch, y_batch in loader:
            numeric_batch = numeric_batch.to(device, non_blocking=True)
            player_batch = player_batch.to(device, non_blocking=True)
            action_batch = action_batch.to(device, non_blocking=True)
            y_batch = y_batch.to(device, non_blocking=True)

            optimizer.zero_grad()
            logits = model(numeric_batch, player_batch, action_batch)
            loss = criterion(logits, y_batch)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)
            optimizer.step()
            if step_scheduler_per_batch:
                scheduler.step()
            total_loss += loss.item() * numeric_batch.shape[0]

        train_loss = total_loss / len(dataset)
        _, val_metrics = evaluate(
            model, numeric_val, player_t_val, action_t_val, y_val.to_numpy(), args.batch_size, device
        )
        if not step_scheduler_per_batch:
            scheduler.step(val_metrics["roc_auc"])

        elapsed = time.time() - epoch_start
        print(
            f"Epoch {epoch:3d}/{args.epochs}  loss={train_loss:.4f}  "
            f"val_acc={val_metrics['accuracy']:.4f}  val_auc={val_metrics['roc_auc']:.4f}  "
            f"({elapsed:.1f}s)"
        )

        if val_metrics["roc_auc"] > best_val_auc:
            best_val_auc = val_metrics["roc_auc"]
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            epochs_without_improvement = 0
        else:
            epochs_without_improvement += 1
            if epochs_without_improvement >= args.patience:
                print(f"Early stopping at epoch {epoch} (best val_auc={best_val_auc:.4f})")
                break

    assert best_state is not None
    model.load_state_dict(best_state)

    # Pick decision threshold on validation set, then report final numbers on held-out test set.
    val_prob, _ = evaluate(model, numeric_val, player_t_val, action_t_val, y_val.to_numpy(), args.batch_size, device)
    tuned_threshold, _ = sweep_threshold(y_val.to_numpy(), val_prob)

    test_prob, test_metrics_default = evaluate(
        model, numeric_test, player_t_test, action_t_test, y_test.to_numpy(), args.batch_size, device
    )
    test_pred_tuned = (test_prob >= tuned_threshold).astype(int)
    test_metrics_tuned = {
        "accuracy": float(accuracy_score(y_test, test_pred_tuned)),
        "precision": float(precision_score(y_test, test_pred_tuned, zero_division=0)),
        "recall": float(recall_score(y_test, test_pred_tuned, zero_division=0)),
        "f1_score": float(f1_score(y_test, test_pred_tuned, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, test_prob)),
        "threshold": tuned_threshold,
    }
    test_metrics_default["threshold"] = 0.5

    print("=" * 60)
    print("Test metrics @0.50:", json.dumps(test_metrics_default, indent=2))
    print(f"Test metrics @{tuned_threshold:.2f}:", json.dumps(test_metrics_tuned, indent=2))

    xgb_accuracy = None
    if XGBOOST_METADATA_PATH.exists():
        xgb_meta = json.loads(XGBOOST_METADATA_PATH.read_text(encoding="utf-8"))
        xgb_accuracy = (xgb_meta.get("metrics_at_decision_threshold") or {}).get("accuracy")
    if xgb_accuracy is not None:
        print(f"XGBoost production accuracy (tuned threshold): {xgb_accuracy:.4f}")
        print(f"Deep model accuracy (tuned threshold): {test_metrics_tuned['accuracy']:.4f}")
        print(f"Delta: {test_metrics_tuned['accuracy'] - xgb_accuracy:+.4f}")

    # Save model + metadata.
    TRAINED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "model_state_dict": model.state_dict(),
            "num_numeric_features": X_train.shape[1],
            "num_players": len(player_vocab),
            "num_actions": len(action_vocab),
            "player_embed_dim": args.player_embed_dim,
            "action_embed_dim": args.action_embed_dim,
        },
        MODEL_PATH,
    )

    metadata: dict[str, Any] = {
        "model_name": MODEL_NAME,
        "model_type": "PyTorch deep tabular NN (entity embeddings + residual MLP)",
        "phase": "Deep learning push beyond gradient boosting ceiling",
        "target_column": TARGET_COLUMN,
        "features_used": list(MODEL_FEATURES),
        "training_dataset": TRAINING_DATA_PATH.relative_to(ROOT_DIR).as_posix(),
        "training_rows": int(len(X_train)),
        "val_rows": int(len(X_val)),
        "test_rows": int(len(X_test)),
        "metrics": test_metrics_default,
        "metrics_at_decision_threshold": test_metrics_tuned,
        "decision_threshold": tuned_threshold,
        "architecture": {
            "player_embed_dim": args.player_embed_dim,
            "action_embed_dim": args.action_embed_dim,
            "hidden_layers": list(hidden_dims),
            "dropout": [0.30, 0.30, 0.20],
            "skip_connection": "block1 output concatenated into block3 input",
            "batch_norm": True,
            "scheduler": args.scheduler,
        },
        "player_vocab": player_vocab,
        "action_vocab": action_vocab,
        "numeric_feature_mean": mean.tolist(),
        "numeric_feature_std": std.tolist(),
        "prior_rates": prior_rates,
        "training_date": datetime.now(UTC).isoformat(),
        "device_used": str(device),
        "notes": (
            "Trained with entity embeddings for player_id and action_type on top of "
            "the same 75 engineered features used by the production XGBoost model. "
            "Compare metrics_at_decision_threshold.accuracy against "
            "backend/trained_models/model_metadata.json to judge whether this model "
            "should be promoted to production."
        ),
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(f"Model saved to: {MODEL_PATH.relative_to(ROOT_DIR)}")
    print(f"Metadata saved to: {METADATA_PATH.relative_to(ROOT_DIR)}")
    print(f"Total elapsed: {time.time() - start_time:.1f}s")


if __name__ == "__main__":
    main()
