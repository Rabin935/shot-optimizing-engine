from pathlib import Path

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[1]
RAW_DATA_PATH = ROOT_DIR / "data" / "raw" / "shot_logs.csv"
NBA_SHOT_DATASET_DIR = ROOT_DIR / "data" / "raw" / "NBA shot dataset (2000 - 2024)"
PROCESSED_DIR = ROOT_DIR / "data" / "processed"
CLEANED_DATA_PATH = PROCESSED_DIR / "cleaned_shot_logs.csv"
REPORT_PATH = PROCESSED_DIR / "cleaning_report.txt"


def assign_shot_zone(row: pd.Series) -> str:
    # Use distance and shot value to place each attempt into a broad court zone.
    if row["shot_distance"] <= 8:
        return "Paint"
    if row["shot_value"] == 3:
        return "Three Point"
    return "Mid-Range"


def assign_pressure_level(defender_distance: float) -> str:
    # Convert defender distance in feet into readable pressure buckets.
    if defender_distance <= 2.25:
        return "Very Tight"
    if defender_distance <= 4:
        return "Tight"
    if defender_distance <= 6:
        return "Open"
    return "Very Open"


def load_raw_data() -> pd.DataFrame:
    # Stop early with a clear error if the raw NBA shot log file is missing.
    if not RAW_DATA_PATH.exists():
        raise FileNotFoundError(f"Raw dataset not found: {RAW_DATA_PATH}")

    return pd.read_csv(RAW_DATA_PATH)


def game_clock_seconds(mins_left: pd.Series, secs_left: pd.Series) -> pd.Series:
    # NBA shot-chart files store clock pieces separately.
    return pd.to_numeric(mins_left, errors="coerce") * 60 + pd.to_numeric(
        secs_left,
        errors="coerce",
    )


def clean_nba_shot_dataset_file(path: Path) -> pd.DataFrame:
    # Normalize one season file from the richer NBA shot-location dataset.
    raw = pd.read_csv(path)
    cleaned = pd.DataFrame(
        {
            "game_id": raw["GAME_ID"],
            "player_id": raw["PLAYER_ID"],
            "player_name": raw["PLAYER_NAME"],
            "period": raw["QUARTER"],
            "shot_clock": None,
            "dribbles": None,
            "touch_time": None,
            "shot_distance": raw["SHOT_DISTANCE"],
            "shot_value": raw["SHOT_TYPE"].astype(str).str.extract(r"([23])")[0],
            "shot_zone": raw["BASIC_ZONE"],
            "defender_distance": None,
            "pressure_level": None,
            "shot_result": raw["EVENT_TYPE"],
            "shot_made": raw["SHOT_MADE"],
            "points": None,
            "loc_x": raw["LOC_X"],
            "loc_y": raw["LOC_Y"],
            "game_clock_seconds": game_clock_seconds(
                raw["MINS_LEFT"],
                raw["SECS_LEFT"],
            ),
            "is_home": raw["TEAM_NAME"].eq(raw["HOME_TEAM"]).astype(int),
            "action_type": raw["ACTION_TYPE"],
            "shot_type": raw["SHOT_TYPE"],
            "position_group": raw["POSITION_GROUP"],
        }
    )

    return clean_project_columns(cleaned)


def load_added_shot_datasets() -> list[pd.DataFrame]:
    # Load richer shot-chart season files when the user has added them.
    if not NBA_SHOT_DATASET_DIR.exists():
        return []

    season_files = sorted(NBA_SHOT_DATASET_DIR.glob("NBA_*_Shots.csv"))
    cleaned_seasons = []
    for path in season_files:
        cleaned = clean_nba_shot_dataset_file(path)
        if not cleaned.empty:
            cleaned_seasons.append(cleaned)

    return cleaned_seasons


def clean_project_columns(cleaned: pd.DataFrame) -> pd.DataFrame:
    # Apply the shared validation and derived columns used by every source.
    defaults = {
        "shot_clock": 12.0,
        "dribbles": 1.0,
        "touch_time": 2.5,
        "defender_distance": 4.0,
        "pressure_level": None,
        "points": None,
        "loc_x": 0.0,
        "loc_y": 0.0,
        "game_clock_seconds": None,
        "is_home": 0,
        "action_type": "",
        "shot_type": "",
        "position_group": "",
    }
    for column, default in defaults.items():
        if column not in cleaned.columns:
            cleaned[column] = default
        elif default is None:
            continue
        else:
            cleaned[column] = cleaned[column].fillna(default)

    numeric_columns = [
        "period",
        "shot_clock",
        "dribbles",
        "touch_time",
        "shot_distance",
        "shot_value",
        "defender_distance",
        "shot_made",
        "points",
        "loc_x",
        "loc_y",
        "game_clock_seconds",
        "is_home",
    ]
    for column in numeric_columns:
        cleaned[column] = pd.to_numeric(cleaned[column], errors="coerce")

    cleaned["shot_made"] = cleaned["shot_made"].replace({True: 1, False: 0})
    cleaned = cleaned.dropna(
        subset=[
            "period",
            "shot_distance",
            "shot_value",
            "defender_distance",
            "shot_made",
        ]
    )
    cleaned = cleaned[cleaned["shot_value"].isin([2, 3])]
    cleaned = cleaned[cleaned["shot_made"].isin([0, 1])]

    cleaned["shot_zone"] = cleaned.apply(assign_shot_zone, axis=1)
    cleaned["pressure_level"] = cleaned["defender_distance"].apply(
        assign_pressure_level
    )
    cleaned["game_clock_seconds"] = cleaned["game_clock_seconds"].fillna(
        cleaned["shot_clock"]
    )
    cleaned["points"] = cleaned["points"].fillna(
        cleaned["shot_made"] * cleaned["shot_value"]
    )

    return cleaned[FINAL_COLUMNS].reset_index(drop=True)


FINAL_COLUMNS = [
    "game_id",
    "player_id",
    "player_name",
    "period",
    "shot_clock",
    "dribbles",
    "touch_time",
    "shot_distance",
    "shot_value",
    "shot_zone",
    "defender_distance",
    "pressure_level",
    "shot_result",
    "shot_made",
    "points",
    "loc_x",
    "loc_y",
    "game_clock_seconds",
    "is_home",
    "action_type",
    "shot_type",
    "position_group",
]


def clean_shot_logs(raw_df: pd.DataFrame) -> pd.DataFrame:
    # Keep only the columns needed for ShotOptix training and reporting.
    selected_columns = [
        "GAME_ID",
        "PERIOD",
        "SHOT_CLOCK",
        "DRIBBLES",
        "TOUCH_TIME",
        "SHOT_DIST",
        "PTS_TYPE",
        "CLOSE_DEF_DIST",
        "SHOT_RESULT",
        "FGM",
        "PTS",
        "player_name",
        "player_id",
    ]
    cleaned = raw_df[selected_columns].copy()

    # Rename source dataset columns into project-friendly snake_case names.
    cleaned = cleaned.rename(
        columns={
            "GAME_ID": "game_id",
            "PERIOD": "period",
            "SHOT_CLOCK": "shot_clock",
            "DRIBBLES": "dribbles",
            "TOUCH_TIME": "touch_time",
            "SHOT_DIST": "shot_distance",
            "PTS_TYPE": "shot_value",
            "CLOSE_DEF_DIST": "defender_distance",
            "SHOT_RESULT": "shot_result",
            "FGM": "shot_made",
            "PTS": "points",
        }
    )

    cleaned["shot_clock"] = cleaned["shot_clock"].fillna(
        cleaned["shot_clock"].median()
    )

    return clean_project_columns(cleaned)


def write_cleaning_report(raw_df: pd.DataFrame, cleaned_df: pd.DataFrame) -> None:
    # Save a plain-text audit report so data cleaning is easy to inspect later.
    report = [
        "ShotOptix data cleaning report",
        "",
        f"Raw shape: {raw_df.shape}",
        f"Cleaned shape: {cleaned_df.shape}",
        f"Rows added from extra shot datasets: {max(len(cleaned_df) - len(raw_df), 0)}",
        "",
        "Target column: shot_made",
        "Target meaning: 1 = made shot, 0 = missed shot",
        "",
        "Missing values after cleaning:",
        cleaned_df.isna().sum().to_string(),
        "",
        "Made vs missed distribution:",
        cleaned_df["shot_made"].value_counts().sort_index().to_string(),
        "",
        "Shot zone distribution:",
        cleaned_df["shot_zone"].value_counts().to_string(),
    ]

    REPORT_PATH.write_text("\n".join(report), encoding="utf-8")


def main() -> None:
    # Run the full cleaning pipeline and write both dataset and report artifacts.
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    raw_df = load_raw_data()
    cleaned_sources = [clean_shot_logs(raw_df), *load_added_shot_datasets()]
    cleaned_df = pd.concat(cleaned_sources, ignore_index=True)
    cleaned_df = cleaned_df.drop_duplicates(
        subset=[
            "game_id",
            "player_id",
            "period",
            "game_clock_seconds",
            "shot_distance",
            "loc_x",
            "loc_y",
            "shot_made",
        ],
        keep="first",
    )
    cleaned_df.to_csv(CLEANED_DATA_PATH, index=False)
    write_cleaning_report(raw_df, cleaned_df)

    print(f"Saved cleaned dataset to: {CLEANED_DATA_PATH}")
    print(f"Saved cleaning report to: {REPORT_PATH}")
    print(f"Cleaned shape: {cleaned_df.shape}")


if __name__ == "__main__":
    main()
