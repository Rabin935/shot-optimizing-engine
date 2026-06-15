from pathlib import Path

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[1]
RAW_DATA_PATH = ROOT_DIR / "data" / "raw" / "shot_logs.csv"
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

    required_columns = [
        "period",
        "dribbles",
        "touch_time",
        "shot_distance",
        "shot_value",
        "defender_distance",
        "shot_made",
    ]
    # Drop rows that are missing fields required for model-ready examples.
    cleaned = cleaned.dropna(subset=required_columns)
    cleaned["shot_clock"] = cleaned["shot_clock"].fillna(
        cleaned["shot_clock"].median()
    )

    # Force numeric columns to real numbers so filters and training are reliable.
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
    ]
    for column in numeric_columns:
        cleaned[column] = pd.to_numeric(cleaned[column], errors="coerce")

    # Keep only valid basketball attempts and valid made/missed labels.
    cleaned = cleaned.dropna(subset=numeric_columns)
    cleaned = cleaned[cleaned["shot_value"].isin([2, 3])]
    cleaned = cleaned[cleaned["shot_made"].isin([0, 1])]

    # Add derived features used by the app and the later ML normalization step.
    cleaned["shot_zone"] = cleaned.apply(assign_shot_zone, axis=1)
    cleaned["pressure_level"] = cleaned["defender_distance"].apply(
        assign_pressure_level
    )

    final_columns = [
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
    ]

    return cleaned[final_columns].reset_index(drop=True)


def write_cleaning_report(raw_df: pd.DataFrame, cleaned_df: pd.DataFrame) -> None:
    # Save a plain-text audit report so data cleaning is easy to inspect later.
    report = [
        "ShotOptix data cleaning report",
        "",
        f"Raw shape: {raw_df.shape}",
        f"Cleaned shape: {cleaned_df.shape}",
        f"Rows removed: {len(raw_df) - len(cleaned_df)}",
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
    cleaned_df = clean_shot_logs(raw_df)
    cleaned_df.to_csv(CLEANED_DATA_PATH, index=False)
    write_cleaning_report(raw_df, cleaned_df)

    print(f"Saved cleaned dataset to: {CLEANED_DATA_PATH}")
    print(f"Saved cleaning report to: {REPORT_PATH}")
    print(f"Cleaned shape: {cleaned_df.shape}")


if __name__ == "__main__":
    main()
