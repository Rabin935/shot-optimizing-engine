"""
Build a player_id -> shooting-mechanics lookup from the public NBA player
shooting-motion dataset (real 3PT release biomechanics captured 2013-2016,
via SportVU-derived tracking, published by Ryan Davis /
public_sport_science_datasets).

This is genuine pre-shot, player-intrinsic signal (release height, release
velocity, shot-path efficiency) that the current model does not have access
to at all -- distinct from the target-encoded "prior_rates" that are
recomputed per train split. Only 189 players are covered (the players who
took enough tracked 3PT shots in 2013-2016), so this is necessarily a sparse
feature; rows outside that coverage fall back to the dataset-wide mean and a
has_shooting_motion_data=0 flag lets the model learn to trust it
conditionally.

Output: data/processed/player_shot_mechanics.json
    {
      "players": {"<player_id>": {feature: value, ...}, ...},
      "global_mean": {feature: value, ...}
    }

Usage:
    python scripts/build_player_shot_mechanics.py
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parents[1]
SOURCE_PATH = (
    ROOT_DIR
    / "data"
    / "raw"
    / "github_public_sport_science_datasets"
    / "Basketball NBA Player Shooting Motions"
    / "player_metrics"
)
OUTPUT_PATH = ROOT_DIR / "data" / "processed" / "player_shot_mechanics.json"

# Source column -> project feature name. Values come from the *unconditional*
# player_metrics file (not player_metrics_made/miss), so there is no
# outcome-derived leakage: these describe how a player shoots in general,
# not how a specific shot ended.
FEATURE_COLUMNS = {
    "rz": "release_height",
    "rt": "release_time",
    "rv": "release_velocity",
    "mnv": "shot_motion_min_velocity",
    "mxv": "shot_motion_max_velocity",
    "pl": "shot_path_length",
    "plr": "shot_path_length_ratio",
}


def main() -> None:
    if not SOURCE_PATH.exists():
        raise FileNotFoundError(f"Shooting motion dataset not found: {SOURCE_PATH}")

    raw = pd.read_feather(SOURCE_PATH)
    subset = raw[["pid", *FEATURE_COLUMNS.keys()]].rename(columns=FEATURE_COLUMNS)
    subset["pid"] = pd.to_numeric(subset["pid"], errors="coerce")
    subset = subset.dropna(subset=["pid"])

    # A handful of players have +/-inf in the source (divide-by-zero in the
    # original velocity computation) -- treat as missing rather than letting
    # it poison the global mean.
    feature_names_all = list(FEATURE_COLUMNS.values())
    for name in feature_names_all:
        subset[name] = subset[name].mask(np.isinf(subset[name]))

    feature_names = list(FEATURE_COLUMNS.values())
    global_mean = {name: float(subset[name].mean(skipna=True)) for name in feature_names}

    players: dict[str, dict[str, float]] = {}
    for _, row in subset.iterrows():
        player_id = str(int(row["pid"]))
        values = {}
        for name in feature_names:
            value = row[name]
            values[name] = float(value) if pd.notna(value) else global_mean[name]
        players[player_id] = values

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps({"players": players, "global_mean": global_mean}, indent=2),
        encoding="utf-8",
    )

    print(f"Saved shooting mechanics lookup for {len(players)} players to {OUTPUT_PATH}")
    print(f"Global means: {json.dumps(global_mean, indent=2)}")


if __name__ == "__main__":
    main()
