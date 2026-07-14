import pandas as pd

MODEL_FEATURES = [
    "period",
    "shot_clock",
    "dribbles",
    "touch_time",
    "shot_distance",
    "shot_angle",
    "defender_distance",
    "loc_x",
    "loc_y",
    "abs_loc_x",
    "game_clock_seconds",
    "is_home",
    "shot_value",
    "player_height_inches",
    "player_weight",
    "player_season_exp",
    "player_draft_number",
    "defender_height_wo_shoes_in",
    "defender_wingspan_in",
    "defender_wingspan_diff_in",
    "defender_d_dpm",
    "defender_length_pressure",
    "defender_height_pressure",
    "distance_pressure_interaction",
    "late_clock",
    "early_clock",
    "quick_touch",
    "high_dribble",
    "long_three",
    "deep_two",
    "is_layup",
    "is_dunk",
    "is_jump_shot",
    "is_pullup",
    "is_driving",
    "is_fadeaway",
    "is_hook",
    "is_tip",
    "position_guard",
    "position_forward",
    "position_center",
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
    "period": 4,
    "shot_clock": 12.0,
    "dribbles": 1.0,
    "touch_time": 2.5,
    "shot_distance": 0.0,
    "shot_angle": 0.0,
    "defender_distance": 4.0,
    "loc_x": 0.0,
    "loc_y": 0.0,
    "game_clock_seconds": 12.0,
    "is_home": 0,
    "shot_value": 2,
    "player_height_inches": 79.0,
    "player_weight": 215.0,
    "player_season_exp": 4.0,
    "player_draft_number": 60.0,
    "defender_height_wo_shoes_in": 79.0,
    "defender_wingspan_in": 82.0,
    "defender_wingspan_diff_in": 3.0,
    "defender_d_dpm": 0.0,
}

DEFAULT_SHOT_ZONE = "Mid-Range"
DEFAULT_PRESSURE_LEVEL = "Tight"
DEFAULT_ACTION_TYPE = ""
DEFAULT_SHOT_TYPE = ""
DEFAULT_POSITION_GROUP = ""


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


def add_derived_features(features: pd.DataFrame) -> None:
    # Derived inputs expose basketball interactions that tree splits can reuse.
    safe_defender_distance = features["defender_distance"].clip(lower=0.5)
    features["distance_pressure_interaction"] = (
        features["shot_distance"] / safe_defender_distance
    )
    features["late_clock"] = (features["shot_clock"] <= 4).astype(int)
    features["early_clock"] = (features["shot_clock"] >= 18).astype(int)
    features["quick_touch"] = (
        (features["touch_time"] <= 2.0) & (features["dribbles"] <= 1)
    ).astype(int)
    features["high_dribble"] = (features["dribbles"] >= 6).astype(int)
    features["long_three"] = (
        (features["shot_value"] == 3) & (features["shot_distance"] >= 26)
    ).astype(int)
    features["deep_two"] = (
        (features["shot_value"] == 2) & (features["shot_distance"] >= 16)
    ).astype(int)
    features["abs_loc_x"] = features["loc_x"].abs()
    features["defender_length_pressure"] = (
        features["defender_wingspan_in"] / safe_defender_distance
    )
    features["defender_height_pressure"] = (
        features["defender_height_wo_shoes_in"] / safe_defender_distance
    )


def add_action_features(features: pd.DataFrame, action_type: pd.Series) -> None:
    action = action_type.apply(normalize_text)
    features["is_layup"] = action.str.contains("layup").astype(int)
    features["is_dunk"] = action.str.contains("dunk").astype(int)
    features["is_jump_shot"] = action.str.contains("jump").astype(int)
    features["is_pullup"] = (
        action.str.contains("pullup") | action.str.contains("pull up")
    ).astype(int)
    features["is_driving"] = action.str.contains("driving").astype(int)
    features["is_fadeaway"] = action.str.contains("fadeaway").astype(int)
    features["is_hook"] = action.str.contains("hook").astype(int)
    features["is_tip"] = action.str.contains("tip").astype(int)


def add_position_features(features: pd.DataFrame, position_group: pd.Series) -> None:
    position = position_group.apply(normalize_text)
    features["position_guard"] = position.str.contains("g").astype(int)
    features["position_forward"] = position.str.contains("f").astype(int)
    features["position_center"] = position.str.contains("c").astype(int)


def categorical_feature(df: pd.DataFrame, column: str, default: str) -> pd.Series:
    # Missing categorical columns use the requested safe default category.
    if column in df.columns:
        return df[column].fillna(default)

    return pd.Series(default, index=df.index)


def build_features_from_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    # Start with numeric model inputs from the normalized training dataframe.
    features = pd.DataFrame(index=df.index)

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
        "shot_value",
        "player_height_inches",
        "player_weight",
        "player_season_exp",
        "player_draft_number",
        "defender_height_wo_shoes_in",
        "defender_wingspan_in",
        "defender_wingspan_diff_in",
        "defender_d_dpm",
    ]:
        features[column] = numeric_feature(df, column)

    add_derived_features(features)
    action_type = categorical_feature(df, "action_type", DEFAULT_ACTION_TYPE)
    position_group = categorical_feature(
        df,
        "position_group",
        DEFAULT_POSITION_GROUP,
    )
    add_action_features(features, action_type)
    add_position_features(features, position_group)

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
        "loc_x": getattr(request, "loc_x", NUMERIC_DEFAULTS["loc_x"]),
        "loc_y": getattr(request, "loc_y", NUMERIC_DEFAULTS["loc_y"]),
        "game_clock_seconds": getattr(
            request,
            "game_clock_seconds",
            NUMERIC_DEFAULTS["game_clock_seconds"],
        ),
        "is_home": getattr(request, "is_home", NUMERIC_DEFAULTS["is_home"]),
        "period": getattr(request, "period", NUMERIC_DEFAULTS["period"]),
        "shot_clock": getattr(
            request,
            "shot_clock",
            NUMERIC_DEFAULTS["shot_clock"],
        ),
        "dribbles": getattr(request, "dribbles", NUMERIC_DEFAULTS["dribbles"]),
        "touch_time": getattr(
            request,
            "touch_time",
            NUMERIC_DEFAULTS["touch_time"],
        ),
        "shot_value": getattr(request, "shot_value", NUMERIC_DEFAULTS["shot_value"]),
        "player_height_inches": getattr(
            request,
            "player_height_inches",
            NUMERIC_DEFAULTS["player_height_inches"],
        ),
        "player_weight": getattr(
            request,
            "player_weight",
            NUMERIC_DEFAULTS["player_weight"],
        ),
        "player_season_exp": getattr(
            request,
            "player_season_exp",
            NUMERIC_DEFAULTS["player_season_exp"],
        ),
        "player_draft_number": getattr(
            request,
            "player_draft_number",
            NUMERIC_DEFAULTS["player_draft_number"],
        ),
        "defender_height_wo_shoes_in": getattr(
            request,
            "defender_height_wo_shoes_in",
            NUMERIC_DEFAULTS["defender_height_wo_shoes_in"],
        ),
        "defender_wingspan_in": getattr(
            request,
            "defender_wingspan_in",
            NUMERIC_DEFAULTS["defender_wingspan_in"],
        ),
        "defender_wingspan_diff_in": getattr(
            request,
            "defender_wingspan_diff_in",
            NUMERIC_DEFAULTS["defender_wingspan_diff_in"],
        ),
        "defender_d_dpm": getattr(
            request,
            "defender_d_dpm",
            NUMERIC_DEFAULTS["defender_d_dpm"],
        ),
        "shot_zone": getattr(request, "shot_zone", DEFAULT_SHOT_ZONE),
        "pressure_level": getattr(request, "pressure_level", DEFAULT_PRESSURE_LEVEL),
        "action_type": getattr(request, "action_type", DEFAULT_ACTION_TYPE),
        "shot_type": getattr(request, "shot_type", DEFAULT_SHOT_TYPE),
        "position_group": getattr(
            request,
            "position_group",
            DEFAULT_POSITION_GROUP,
        ),
    }

    df = pd.DataFrame([row])

    # Reuse the dataframe builder so training and live prediction cannot drift.
    return build_features_from_dataframe(df)
