from pathlib import Path
from typing import Iterable

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIRS = [
    ROOT_DIR / "data" / "processed",
    ROOT_DIR / "data" / "raw",
]
PREFERRED_DATASETS = [
    "cleaned_shot_logs.csv",
    "shot_logs.csv",
]
TARGET_CANDIDATES = [
    "shot_made",
    "made",
    "is_made",
    "shot_result",
    "SHOT_MADE",
]
SHOT_ZONE_CANDIDATES = [
    "shot_zone",
    "SHOT_ZONE",
    "zone",
    "SHOT_ZONE_BASIC",
    "SHOT_ZONE_AREA",
    "SHOT_ZONE_RANGE",
]
MODEL_FEATURE_CANDIDATES = [
    "shooter_x",
    "shooter_y",
    "defender_x",
    "defender_y",
    "shot_distance",
    "SHOT_DIST",
    "shot_angle",
    "shot_zone",
    "SHOT_ZONE",
    "defender_distance",
    "CLOSE_DEF_DIST",
    "pressure_level",
    "shot_value",
    "PTS_TYPE",
    "period",
    "PERIOD",
    "shot_clock",
    "SHOT_CLOCK",
    "dribbles",
    "DRIBBLES",
    "touch_time",
    "TOUCH_TIME",
]


def find_main_dataset() -> Path:
    # Prefer the cleaned dataset, then raw data, then the largest available CSV.
    available_csvs = [
        path
        for data_dir in DATA_DIRS
        if data_dir.exists()
        for path in data_dir.glob("*.csv")
    ]
    if not available_csvs:
        raise FileNotFoundError("No CSV datasets found in data/processed or data/raw.")

    for filename in PREFERRED_DATASETS:
        for path in available_csvs:
            if path.name == filename:
                return path

    return max(available_csvs, key=lambda path: path.stat().st_size)


def existing_columns(df: pd.DataFrame, candidates: Iterable[str]) -> list[str]:
    # Return the candidate columns that actually exist in this dataset.
    return [column for column in candidates if column in df.columns]


def is_binary_made_target(series: pd.Series) -> bool:
    # A supervised shot target should be 1/0 or True/False made/missed values.
    values = set(series.dropna().unique().tolist())
    return bool(values) and values.issubset({0, 1, 0.0, 1.0, False, True})


def is_text_result_target(series: pd.Series) -> bool:
    # Some datasets store the target as words instead of numeric labels.
    values = {str(value).strip().lower() for value in series.dropna().unique()}
    made_tokens = {"made", "made shot"}
    missed_tokens = {"missed", "missed shot", "miss"}
    return bool(values) and values.issubset(made_tokens | missed_tokens)


def detect_target_column(df: pd.DataFrame) -> tuple[str | None, str]:
    # Scan likely target names and explain what kind of target was found.
    for column in existing_columns(df, TARGET_CANDIDATES):
        series = df[column]
        if is_binary_made_target(series):
            return column, "binary made/missed target (1 = made, 0 = missed)"
        if is_text_result_target(series):
            return column, "text made/missed target"

    return None, "no real made/missed target column found"


def print_unique_values(df: pd.DataFrame, columns: list[str], title: str) -> None:
    # Print distinct values for human review during data inspection.
    print(title)
    if not columns:
        print("  None found")
        return

    for column in columns:
        values = sorted(df[column].dropna().unique().tolist(), key=lambda value: str(value))
        print(f"  {column}: {values}")


def main() -> None:
    # Produce a console report; this script does not modify data or train models.
    dataset_path = find_main_dataset()
    df = pd.read_csv(dataset_path)
    target_column, target_description = detect_target_column(df)
    shot_zone_columns = existing_columns(df, SHOT_ZONE_CANDIDATES)
    target_columns = existing_columns(df, TARGET_CANDIDATES)
    feature_columns = existing_columns(df, MODEL_FEATURE_CANDIDATES)

    print("ShotOptix dataset inspection report")
    print("=" * 38)
    print(f"Dataset used: {dataset_path.relative_to(ROOT_DIR)}")
    print(f"Shape: {df.shape}")
    print()

    print("Columns:")
    print(df.columns.tolist())
    print()

    print("First 10 rows:")
    print(df.head(10).to_string(index=False))
    print()

    print("Missing values:")
    print(df.isna().sum().to_string())
    print()

    print("Data types:")
    print(df.dtypes.to_string())
    print()

    print_unique_values(df, shot_zone_columns, "Unique shot zone values:")
    print()

    print_unique_values(df, target_columns, "Unique shot result/target values:")
    print()

    print("Target detection:")
    if target_column:
        print(f"  Target column: {target_column}")
        print(f"  Target meaning: {target_description}")
    else:
        print("  Target column: None")
        print(
            "  Dataset is not suitable for real supervised ML yet because no real "
            "made/missed target exists."
        )
    print()

    print("Candidate model features present:")
    if feature_columns:
        for column in feature_columns:
            print(f"  - {column}")
    else:
        print("  None of the expected shot context feature columns were found.")
    print()

    print("Training status: inspection only; no model training was run.")


if __name__ == "__main__":
    main()
