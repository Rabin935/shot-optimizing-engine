from pathlib import Path
from typing import Iterable

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIRS = [
    ROOT_DIR / "data" / "processed",
    ROOT_DIR / "data" / "raw",
]
PREFERRED_INPUT_DATASETS = [
    "cleaned_shot_logs.csv",
    "shot_logs.csv",
]
OUTPUT_DATA_PATH = ROOT_DIR / "data" / "processed" / "shotoptix_ml_training.csv"

MODEL_COLUMNS = [
    "period",
    "shot_clock",
    "dribbles",
    "touch_time",
    "shot_distance",
    "shot_angle",
    "defender_distance",
    "loc_x",
    "loc_y",
    "game_clock_seconds",
    "is_home",
    "player_height_inches",
    "player_weight",
    "player_season_exp",
    "player_draft_number",
    "defender_height_wo_shoes_in",
    "defender_wingspan_in",
    "defender_wingspan_diff_in",
    "defender_d_dpm",
    "action_type",
    "shot_type",
    "position_group",
    "shot_zone",
    "pressure_level",
    "shot_value",
    "shot_made",
]

COLUMN_ALIASES = {
    "period": ["period", "PERIOD"],
    "shot_clock": ["shot_clock", "SHOT_CLOCK"],
    "dribbles": ["dribbles", "DRIBBLES"],
    "touch_time": ["touch_time", "TOUCH_TIME"],
    "shot_distance": ["shot_distance", "SHOT_DIST"],
    "shot_angle": ["shot_angle", "SHOT_ANGLE"],
    "defender_distance": ["defender_distance", "CLOSE_DEF_DIST"],
    "loc_x": ["loc_x", "LOC_X", "shotX"],
    "loc_y": ["loc_y", "LOC_Y", "shotY"],
    "game_clock_seconds": ["game_clock_seconds", "time_remaining"],
    "is_home": ["is_home"],
    "player_height_inches": ["player_height_inches"],
    "player_weight": ["player_weight"],
    "player_season_exp": ["player_season_exp"],
    "player_draft_number": ["player_draft_number"],
    "defender_height_wo_shoes_in": ["defender_height_wo_shoes_in"],
    "defender_wingspan_in": ["defender_wingspan_in"],
    "defender_wingspan_diff_in": ["defender_wingspan_diff_in"],
    "defender_d_dpm": ["defender_d_dpm"],
    "action_type": ["action_type", "ACTION_TYPE"],
    "shot_type": ["shot_type", "SHOT_TYPE", "shot_type"],
    "position_group": ["position_group", "POSITION_GROUP"],
    "shot_zone": [
        "shot_zone",
        "SHOT_ZONE",
        "SHOT_ZONE_BASIC",
        "SHOT_ZONE_AREA",
        "SHOT_ZONE_RANGE",
    ],
    "pressure_level": ["pressure_level", "PRESSURE_LEVEL"],
    "shot_value": ["shot_value", "PTS_TYPE"],
    "shot_made": ["shot_made", "FGM", "made", "is_made", "SHOT_MADE"],
    "shot_result": ["shot_result", "SHOT_RESULT"],
}


def find_input_dataset() -> Path:
    # Choose the best available source dataset while avoiding this script's output.
    available_csvs = [
        path
        for data_dir in DATA_DIRS
        if data_dir.exists()
        for path in data_dir.glob("*.csv")
        if path.name != OUTPUT_DATA_PATH.name
    ]
    if not available_csvs:
        raise FileNotFoundError("No CSV datasets found in data/processed or data/raw.")

    for filename in PREFERRED_INPUT_DATASETS:
        for path in available_csvs:
            if path.name == filename:
                return path

    return max(available_csvs, key=lambda path: path.stat().st_size)


def first_existing_column(df: pd.DataFrame, candidates: Iterable[str]) -> str | None:
    # Find the first source column that matches one of our known aliases.
    for column in candidates:
        if column in df.columns:
            return column
    return None


def standardize_column(df: pd.DataFrame, output_column: str) -> None:
    # Copy a source column into the normalized project column name when possible.
    source_column = first_existing_column(df, COLUMN_ALIASES[output_column])
    if source_column is not None:
        df[output_column] = df[source_column]


def normalize_shot_zone(value: object) -> str | None:
    # Convert raw dataset zone labels into the three zones used for training.
    if pd.isna(value):
        return None

    text = str(value).strip().lower()
    compact = text.replace("-", " ").replace("_", " ")

    if compact in {
        "paint",
        "restricted area",
        "in the paint",
        "less than 8 ft.",
        "less than 8 ft",
    }:
        return "Paint"

    if compact in {
        "mid range",
        "midrange",
        "8 16 ft.",
        "8 16 ft",
        "16 24 ft.",
        "16 24 ft",
    }:
        return "Mid-Range"

    if (
        "three" in compact
        or "3pt" in compact
        or "3 point" in compact
        or compact in {"24+ ft.", "24+ ft"}
    ):
        return "Three Point"

    return None


def infer_shot_zone(row: pd.Series) -> str | None:
    # Fill missing zone labels from shot value and distance when possible.
    shot_value = row.get("shot_value")
    shot_distance = row.get("shot_distance")

    if pd.notna(shot_value) and int(shot_value) == 3:
        return "Three Point"

    if pd.isna(shot_distance):
        return None

    if float(shot_distance) <= 8:
        return "Paint"

    return "Mid-Range"


def pressure_from_defender_distance(distance: object) -> str | None:
    # Derive pressure from closest defender distance using project thresholds.
    if pd.isna(distance):
        return None

    distance = float(distance)

    if distance <= 2.25:
        return "Very Tight"
    if distance <= 4:
        return "Tight"
    if distance <= 8.5:
        return "Open"
    return "Very Open"


def normalize_pressure_level(value: object) -> str | None:
    # Convert text pressure labels into the four canonical pressure buckets.
    if pd.isna(value):
        return None

    compact = str(value).strip().lower().replace("-", " ").replace("_", " ")

    if compact == "very tight":
        return "Very Tight"
    if compact in {"tight", "moderate"}:
        return "Tight"
    if compact == "open":
        return "Open"
    if compact in {"very open", "wide open"}:
        return "Very Open"

    return None


def normalize_target(df: pd.DataFrame) -> None:
    # Build a real made/missed target and reject datasets without one.
    standardize_column(df, "shot_made")

    if "shot_made" in df.columns:
        df["shot_made"] = pd.to_numeric(df["shot_made"], errors="coerce")
        return

    standardize_column(df, "shot_result")
    if "shot_result" not in df.columns:
        raise ValueError(
            "No actual made/missed target column found. Do not use EPPS, "
            "recommendation, or shot_quality as the training target."
        )

    result = df["shot_result"].astype(str).str.strip().str.lower()
    df["shot_made"] = result.map(
        {
            "made": 1,
            "made shot": 1,
            "miss": 0,
            "missed": 0,
            "missed shot": 0,
        }
    )


def normalize_dataset(df: pd.DataFrame) -> pd.DataFrame:
    # Create a normalized training dataframe with only model-ready columns.
    normalized = df.copy()

    # Standardize raw column names before converting values.
    for column in [
        "period",
        "shot_clock",
        "dribbles",
        "touch_time",
        "shot_distance",
        "shot_angle",
        "defender_distance",
        "loc_x",
        "loc_y",
        "game_clock_seconds",
        "is_home",
        "player_height_inches",
        "player_weight",
        "player_season_exp",
        "player_draft_number",
        "defender_height_wo_shoes_in",
        "defender_wingspan_in",
        "defender_wingspan_diff_in",
        "defender_d_dpm",
        "action_type",
        "shot_type",
        "position_group",
        "shot_zone",
        "pressure_level",
        "shot_value",
    ]:
        standardize_column(normalized, column)

    # Convert numeric inputs to numbers so invalid strings become missing values.
    for column in [
        "period",
        "shot_clock",
        "dribbles",
        "touch_time",
        "shot_distance",
        "shot_angle",
        "defender_distance",
        "loc_x",
        "loc_y",
        "game_clock_seconds",
        "is_home",
        "player_height_inches",
        "player_weight",
        "player_season_exp",
        "player_draft_number",
        "defender_height_wo_shoes_in",
        "defender_wingspan_in",
        "defender_wingspan_diff_in",
        "defender_d_dpm",
        "shot_value",
    ]:
        if column in normalized.columns:
            normalized[column] = pd.to_numeric(normalized[column], errors="coerce")

    for column, default in [
        ("loc_x", 0.0),
        ("loc_y", 0.0),
        ("game_clock_seconds", 12.0),
        ("is_home", 0),
        ("player_height_inches", 79.0),
        ("player_weight", 215.0),
        ("player_season_exp", 4.0),
        ("player_draft_number", 60.0),
        ("defender_height_wo_shoes_in", 79.0),
        ("defender_wingspan_in", 82.0),
        ("defender_wingspan_diff_in", 3.0),
        ("defender_d_dpm", 0.0),
        ("action_type", ""),
        ("shot_type", ""),
        ("position_group", ""),
    ]:
        if column not in normalized.columns:
            normalized[column] = default
        else:
            normalized[column] = normalized[column].fillna(default)

    # Shot angle is optional in some datasets, so default it to zero.
    if "shot_angle" not in normalized.columns:
        normalized["shot_angle"] = 0.0
    normalized["shot_angle"] = normalized["shot_angle"].fillna(0.0)

    # Normalize existing zones, then infer zones for rows still missing them.
    if "shot_zone" in normalized.columns:
        normalized["shot_zone"] = normalized["shot_zone"].apply(normalize_shot_zone)

    if "shot_zone" not in normalized.columns:
        normalized["shot_zone"] = None
    missing_zone = normalized["shot_zone"].isna()
    normalized.loc[missing_zone, "shot_zone"] = normalized.loc[missing_zone].apply(
        infer_shot_zone,
        axis=1,
    )

    # Fill missing point values from the normalized shot zone.
    if "shot_value" not in normalized.columns:
        normalized["shot_value"] = None
    missing_shot_value = normalized["shot_value"].isna()
    normalized.loc[missing_shot_value, "shot_value"] = normalized.loc[
        missing_shot_value,
        "shot_zone",
    ].map({"Paint": 2, "Mid-Range": 2, "Three Point": 3})
    normalized["shot_value"] = pd.to_numeric(
        normalized["shot_value"],
        errors="coerce",
    )

    # Prefer deriving pressure from defender distance because it is numeric.
    if "defender_distance" in normalized.columns:
        normalized["pressure_level"] = normalized["defender_distance"].apply(
            pressure_from_defender_distance
        )
    elif "pressure_level" in normalized.columns:
        normalized["pressure_level"] = normalized["pressure_level"].apply(
            normalize_pressure_level
        )
    else:
        normalized["pressure_level"] = None

    # Keep only the columns used for supervised ML training.
    normalize_target(normalized)

    normalized = normalized[MODEL_COLUMNS].copy()
    normalized = normalized.dropna(subset=MODEL_COLUMNS)

    # Remove rows outside the supported ShotOptix modeling categories.
    normalized = normalized[
        normalized["shot_zone"].isin(["Paint", "Mid-Range", "Three Point"])
    ]
    normalized = normalized[
        normalized["pressure_level"].isin(
            ["Very Tight", "Tight", "Open", "Very Open"]
        )
    ]
    normalized = normalized[normalized["shot_value"].isin([2, 3])]
    normalized = normalized[normalized["shot_made"].isin([0, 1])]

    normalized["shot_value"] = normalized["shot_value"].astype(int)
    normalized["shot_made"] = normalized["shot_made"].astype(int)

    return normalized.reset_index(drop=True)


def main() -> None:
    # Load, normalize, save, and print a compact dataset summary.
    dataset_path = find_input_dataset()
    df = pd.read_csv(dataset_path, low_memory=False)
    normalized = normalize_dataset(df)

    OUTPUT_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    normalized.to_csv(OUTPUT_DATA_PATH, index=False)

    print("ShotOptix ML dataset normalization complete")
    print("=" * 46)
    print(f"Input dataset: {dataset_path.relative_to(ROOT_DIR)}")
    print(f"Output dataset: {OUTPUT_DATA_PATH.relative_to(ROOT_DIR)}")
    print(f"Input shape: {df.shape}")
    print(f"Output shape: {normalized.shape}")
    print()
    print("Shot zone distribution:")
    print(normalized["shot_zone"].value_counts().to_string())
    print()
    print("Pressure level distribution:")
    print(normalized["pressure_level"].value_counts().to_string())
    print()
    print("Target distribution:")
    print(normalized["shot_made"].value_counts().sort_index().to_string())


if __name__ == "__main__":
    main()
