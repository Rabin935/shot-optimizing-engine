import pandas as pd

MODEL_FEATURES = [
    "shot_distance",
    "shot_angle",
    "defender_distance",
    "shot_value",
    "zone_paint",
    "zone_mid_range",
    "zone_three_point",
    "pressure_very_tight",
    "pressure_tight",
    "pressure_open",
    "pressure_very_open",
]

ZONE_FEATURES = ["zone_paint", "zone_mid_range", "zone_three_point"]
PRESSURE_FEATURES = [
    "pressure_very_tight",
    "pressure_tight",
    "pressure_open",
    "pressure_very_open",
]

NUMERIC_DEFAULTS = {
    "shot_distance": 0.0,
    "shot_angle": 0.0,
    "defender_distance": 4.0,
    "shot_value": 2,
}

DEFAULT_SHOT_ZONE = "Mid-Range"
DEFAULT_PRESSURE_LEVEL = "Tight"


def normalize_text(value: object) -> str:
    # Convert missing or non-string values into one consistent lowercase format.
    if pd.isna(value):
        return ""

    return str(value).strip().lower().replace("-", " ").replace("_", " ")


def normalize_shot_zone(shot_zone: object) -> str:
    # Unknown shot zones fall back to Mid-Range so exactly one zone feature is active.
    normalized_zone = normalize_text(shot_zone)

    if normalized_zone in {"paint", "restricted area", "in the paint"}:
        return "Paint"

    if normalized_zone in {"mid range", "midrange"}:
        return "Mid-Range"

    if (
        "three" in normalized_zone
        or "3pt" in normalized_zone
        or "3 point" in normalized_zone
    ):
        return "Three Point"

    return DEFAULT_SHOT_ZONE


def encode_shot_zone(shot_zone: object) -> dict[str, int]:
    # One-hot encode the normalized zone names used by the training dataset.
    normalized_zone = normalize_shot_zone(shot_zone)

    return {
        "zone_paint": int(normalized_zone == "Paint"),
        "zone_mid_range": int(normalized_zone == "Mid-Range"),
        "zone_three_point": int(normalized_zone == "Three Point"),
    }


def normalize_pressure_level(pressure_level: object) -> str:
    # Unknown pressure values fall back to Tight, matching a conservative default.
    normalized_pressure = normalize_text(pressure_level)

    if normalized_pressure == "very tight":
        return "Very Tight"

    if normalized_pressure == "tight":
        return "Tight"

    if normalized_pressure == "open":
        return "Open"

    if normalized_pressure in {"very open", "wide open"}:
        return "Very Open"

    return DEFAULT_PRESSURE_LEVEL


def encode_pressure_level(pressure_level: object) -> dict[str, int]:
    # One-hot encode pressure so the model sees the same columns every time.
    normalized_pressure = normalize_pressure_level(pressure_level)

    return {
        "pressure_very_tight": int(normalized_pressure == "Very Tight"),
        "pressure_tight": int(normalized_pressure == "Tight"),
        "pressure_open": int(normalized_pressure == "Open"),
        "pressure_very_open": int(normalized_pressure == "Very Open"),
    }


def numeric_feature(df: pd.DataFrame, column: str) -> pd.Series:
    # Missing columns or invalid values become sensible defaults instead of NaN.
    default = NUMERIC_DEFAULTS[column]
    values = df[column] if column in df.columns else pd.Series(default, index=df.index)
    return pd.to_numeric(values, errors="coerce").fillna(default)


def categorical_feature(df: pd.DataFrame, column: str, default: str) -> pd.Series:
    # Missing categorical columns use the requested safe default category.
    if column in df.columns:
        return df[column].fillna(default)

    return pd.Series(default, index=df.index)


def build_features_from_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    # Start with numeric model inputs from the normalized training dataframe.
    features = pd.DataFrame(index=df.index)

    features["shot_distance"] = numeric_feature(df, "shot_distance")
    features["shot_angle"] = numeric_feature(df, "shot_angle")
    features["defender_distance"] = numeric_feature(df, "defender_distance")
    features["shot_value"] = numeric_feature(df, "shot_value")

    # Encode the same categorical columns during training and API inference.
    shot_zone = categorical_feature(df, "shot_zone", DEFAULT_SHOT_ZONE)
    pressure_level = categorical_feature(df, "pressure_level", DEFAULT_PRESSURE_LEVEL)
    zone_features = pd.DataFrame(
        shot_zone.apply(encode_shot_zone).tolist(),
        index=df.index,
        columns=ZONE_FEATURES,
    )
    pressure_features = pd.DataFrame(
        pressure_level.apply(encode_pressure_level).tolist(),
        index=df.index,
        columns=PRESSURE_FEATURES,
    )

    features = pd.concat(
        [features, zone_features, pressure_features],
        axis=1,
    )

    # Return only the model columns, always in the exact order XGBoost expects.
    return features[MODEL_FEATURES]


def build_features_from_request(request) -> pd.DataFrame:
    # Convert one FastAPI request object into a one-row dataframe.
    row = {
        "shot_distance": getattr(
            request,
            "shot_distance",
            NUMERIC_DEFAULTS["shot_distance"],
        ),
        "shot_angle": getattr(request, "shot_angle", NUMERIC_DEFAULTS["shot_angle"]),
        "defender_distance": getattr(
            request,
            "defender_distance",
            NUMERIC_DEFAULTS["defender_distance"],
        ),
        "shot_value": getattr(request, "shot_value", NUMERIC_DEFAULTS["shot_value"]),
        "shot_zone": getattr(request, "shot_zone", DEFAULT_SHOT_ZONE),
        "pressure_level": getattr(request, "pressure_level", DEFAULT_PRESSURE_LEVEL),
    }

    df = pd.DataFrame([row])

    # Reuse the dataframe builder so training and live prediction cannot drift.
    return build_features_from_dataframe(df)
