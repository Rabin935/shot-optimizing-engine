from typing import Any

import numpy as np
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
    "court_distance",
    "shot_angle_from_court",
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
    "defender_pressure_index",
    "shot_clock_defender_interaction",
    "height_mismatch",
    "wingspan_reach_advantage",
    "dribble_touch_interaction",
    "clock_remaining_fraction",
    "late_clock",
    "early_clock",
    "quick_touch",
    "high_dribble",
    "transition_shot",
    "long_three",
    "deep_two",
    "corner_three",
    "restricted_area",
    "fourth_quarter",
    "overtime",
    "has_real_defender_dpm",
    "has_real_player_bio",
    "is_layup",
    "is_dunk",
    "is_jump_shot",
    "is_pullup",
    "is_driving",
    "is_fadeaway",
    "is_hook",
    "is_tip",
    "is_bank_shot",
    "is_floating",
    "is_reverse",
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
    "zone_make_rate_prior",
    "pressure_make_rate_prior",
    "action_make_rate_prior",
    "distance_bin_make_rate_prior",
    "zone_pressure_make_rate_prior",
    "player_make_rate_prior",
    "has_real_defender_distance",
    "has_court_coordinates",
    "has_shot_distance",
    "team_rest_days",
    "team_travel_distance",
    "team_win_pct",
    "team_streak",
    "opp_rest_days",
    "opp_win_pct",
    "has_real_schedule_context",
]

GLOBAL_MAKE_RATE = 0.45

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
    "team_rest_days": 1.3,
    "team_travel_distance": 533.0,
    "team_win_pct": 0.5,
    "team_streak": 0.0,
    "opp_rest_days": 1.3,
    "opp_win_pct": 0.5,
    "has_real_schedule_context": 0,
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
    features["defender_pressure_index"] = 1.0 / safe_defender_distance
    features["shot_clock_defender_interaction"] = (
        features["shot_clock"] / safe_defender_distance
    )
    features["late_clock"] = (features["shot_clock"] <= 4).astype(int)
    features["early_clock"] = (features["shot_clock"] >= 18).astype(int)
    features["quick_touch"] = (
        (features["touch_time"] <= 2.0) & (features["dribbles"] <= 1)
    ).astype(int)
    features["high_dribble"] = (features["dribbles"] >= 6).astype(int)
    features["transition_shot"] = (
        (features["quick_touch"] == 1) & (features["early_clock"] == 1)
    ).astype(int)
    features["long_three"] = (
        (features["shot_value"] == 3) & (features["shot_distance"] >= 26)
    ).astype(int)
    features["deep_two"] = (
        (features["shot_value"] == 2) & (features["shot_distance"] >= 16)
    ).astype(int)
    features["abs_loc_x"] = features["loc_x"].abs()
    features["court_distance"] = np.sqrt(
        features["loc_x"] ** 2 + features["loc_y"] ** 2
    )
    features["shot_angle_from_court"] = np.arctan2(
        features["loc_x"],
        features["loc_y"].clip(lower=0.1),
    )
    features["corner_three"] = (
        (features["shot_value"] == 3)
        & (features["abs_loc_x"] >= 20)
        & (features["shot_distance"] >= 22)
    ).astype(int)
    features["restricted_area"] = (features["court_distance"] <= 4.0).astype(int)
    features["defender_length_pressure"] = (
        features["defender_wingspan_in"] / safe_defender_distance
    )
    features["defender_height_pressure"] = (
        features["defender_height_wo_shoes_in"] / safe_defender_distance
    )
    features["height_mismatch"] = (
        features["player_height_inches"] - features["defender_height_wo_shoes_in"]
    )
    features["wingspan_reach_advantage"] = (
        features["defender_wingspan_diff_in"] / safe_defender_distance
    )
    features["dribble_touch_interaction"] = (
        features["dribbles"] * features["touch_time"]
    )
    features["clock_remaining_fraction"] = features["shot_clock"] / 24.0
    features["fourth_quarter"] = (features["period"] == 4).astype(int)
    features["overtime"] = (features["period"] > 4).astype(int)
    features["has_real_defender_dpm"] = (features["defender_d_dpm"] != 0.0).astype(
        int
    )
    features["has_real_player_bio"] = (
        (features["player_height_inches"] != NUMERIC_DEFAULTS["player_height_inches"])
        | (features["player_weight"] != NUMERIC_DEFAULTS["player_weight"])
    ).astype(int)
    features["has_real_defender_distance"] = (
        features["defender_distance"] != NUMERIC_DEFAULTS["defender_distance"]
    ).astype(int)
    features["has_court_coordinates"] = (
        (features["loc_x"] != 0.0) | (features["loc_y"] != 0.0)
    ).astype(int)
    features["has_shot_distance"] = (features["shot_distance"] > 0.0).astype(int)


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
    features["is_bank_shot"] = action.str.contains("bank").astype(int)
    features["is_floating"] = action.str.contains("floating").astype(int)
    features["is_reverse"] = action.str.contains("reverse").astype(int)


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


def distance_bin_label(shot_distance: float) -> str:
    if shot_distance <= 8:
        return "0_8"
    if shot_distance <= 16:
        return "8_16"
    if shot_distance <= 22:
        return "16_22"
    if shot_distance <= 26:
        return "22_26"
    if shot_distance <= 35:
        return "26_35"
    return "35_plus"


def compute_prior_rates(df: pd.DataFrame, target_column: str = "shot_made") -> dict[str, Any]:
    # Build smoothed target-encoding lookups from the training split only.
    working = df.copy()
    working[target_column] = pd.to_numeric(working[target_column], errors="coerce")
    global_rate = float(working[target_column].mean())
    smoothing = 50.0

    def build_smoothed_lookup(keys: pd.Series, target: pd.Series) -> dict[str, float]:
        grouped = pd.DataFrame({"key": keys, "target": target}).groupby("key")["target"]
        rates: dict[str, float] = {}
        for key, group in grouped:
            count = float(len(group))
            mean_value = float(group.mean())
            rates[str(key)] = float(
                (count * mean_value + smoothing * global_rate) / (count + smoothing)
            )
        return rates

    shot_zone = categorical_feature(working, "shot_zone", DEFAULT_SHOT_ZONE).apply(
        normalize_shot_zone
    )
    pressure_level = categorical_feature(
        working,
        "pressure_level",
        DEFAULT_PRESSURE_LEVEL,
    ).apply(normalize_pressure_level)
    action_type = categorical_feature(working, "action_type", DEFAULT_ACTION_TYPE).apply(
        normalize_text
    )
    distance_bins = numeric_feature(working, "shot_distance").apply(distance_bin_label)
    zone_pressure = shot_zone + "|" + pressure_level
    player_id = (
        working["player_id"].astype(str)
        if "player_id" in working.columns
        else pd.Series("unknown", index=working.index)
    )

    return {
        "global_make_rate": global_rate,
        "zone": build_smoothed_lookup(shot_zone, working[target_column]),
        "pressure": build_smoothed_lookup(pressure_level, working[target_column]),
        "action": build_smoothed_lookup(action_type, working[target_column]),
        "distance_bin": build_smoothed_lookup(distance_bins, working[target_column]),
        "zone_pressure": build_smoothed_lookup(zone_pressure, working[target_column]),
        "player": build_smoothed_lookup(player_id, working[target_column]),
    }


def add_prior_rate_features(
    features: pd.DataFrame,
    df: pd.DataFrame,
    prior_rates: dict[str, Any] | None,
) -> None:
    global_rate = float((prior_rates or {}).get("global_make_rate", GLOBAL_MAKE_RATE))
    zone_lookup = (prior_rates or {}).get("zone", {})
    pressure_lookup = (prior_rates or {}).get("pressure", {})
    action_lookup = (prior_rates or {}).get("action", {})
    distance_lookup = (prior_rates or {}).get("distance_bin", {})
    zone_pressure_lookup = (prior_rates or {}).get("zone_pressure", {})
    player_lookup = (prior_rates or {}).get("player", {})

    shot_zone = categorical_feature(df, "shot_zone", DEFAULT_SHOT_ZONE).apply(
        normalize_shot_zone
    )
    pressure_level = categorical_feature(df, "pressure_level", DEFAULT_PRESSURE_LEVEL).apply(
        normalize_pressure_level
    )
    action_type = categorical_feature(df, "action_type", DEFAULT_ACTION_TYPE).apply(
        normalize_text
    )
    distance_bins = features["shot_distance"].apply(distance_bin_label)
    zone_pressure = shot_zone + "|" + pressure_level
    player_id = (
        df["player_id"].astype(str)
        if "player_id" in df.columns
        else pd.Series("unknown", index=df.index)
    )

    features["zone_make_rate_prior"] = shot_zone.map(zone_lookup).fillna(global_rate)
    features["pressure_make_rate_prior"] = pressure_level.map(pressure_lookup).fillna(
        global_rate
    )
    features["action_make_rate_prior"] = action_type.map(action_lookup).fillna(global_rate)
    features["distance_bin_make_rate_prior"] = distance_bins.map(distance_lookup).fillna(
        global_rate
    )
    features["zone_pressure_make_rate_prior"] = zone_pressure.map(
        zone_pressure_lookup
    ).fillna(global_rate)
    features["player_make_rate_prior"] = player_id.map(player_lookup).fillna(global_rate)


def build_features_from_dataframe(
    df: pd.DataFrame,
    prior_rates: dict[str, Any] | None = None,
) -> pd.DataFrame:
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
        "team_rest_days",
        "team_travel_distance",
        "team_win_pct",
        "team_streak",
        "opp_rest_days",
        "opp_win_pct",
        "has_real_schedule_context",
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
    add_prior_rate_features(features, df, prior_rates)

    # Return only the model columns, always in the exact order XGBoost expects.
    return features[MODEL_FEATURES]


def build_features_from_request(request, prior_rates: dict[str, Any] | None = None) -> pd.DataFrame:
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
        "player_id": getattr(request, "player_id", "unknown"),
    }

    df = pd.DataFrame([row])

    # Reuse the dataframe builder so training and live prediction cannot drift.
    return build_features_from_dataframe(df, prior_rates=prior_rates)
