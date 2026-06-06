import pandas as pd

MODEL_FEATURES = [
    "shot_distance",
    "shot_angle",
    "defender_distance",
    "shot_value",
    "shot_zone_paint",
    "shot_zone_mid_range",
    "shot_zone_three_point",
    "shot_zone_corner_three",
    "pressure_very_tight",
    "pressure_tight",
    "pressure_open",
    "pressure_very_open",
]

def normalize_text(value: str) -> str:
    return value.strip().lower().replace("-", " ")

def encode_shot_zone(shot_zone: str) -> dict[str, int]:
    normalized_zone = normalize_text(shot_zone)
    
    return {
        "shot_zone_paint": int(normalized_zone == "paint"),
        "shot_zone_mid_range": int(normalized_zone == "mid range"),
        "shot_zone_three_point": int(
            normalized_zone in {"three point", "wing three", "top three"}
        ),
        "shot_zone_corner_three": int(normalized_zone == "corner three"),
    }
    
def encode_pressure_level(pressure_level: str) -> dict[str, int]:
    normalized_pressure = normalize_text(pressure_level)

    return {
        "pressure_very_tight": int(normalized_pressure == "very tight"),
        "pressure_tight": int(normalized_pressure == "tight"),
        "pressure_open": int(normalized_pressure == "open"),
        "pressure_very_open": int(normalized_pressure == "very open"),
    }


def build_features_from_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    features = pd.DataFrame(index=df.index)

    features["shot_distance"] = df["shot_distance"]
    features["shot_angle"] = df.get("shot_angle", 0)
    features["defender_distance"] = df["defender_distance"]
    features["shot_value"] = df["shot_value"]

    zone_features = df["shot_zone"].apply(encode_shot_zone).apply(pd.Series)
    pressure_features = df["pressure_level"].apply(encode_pressure_level).apply(pd.Series)

    features = pd.concat(
        [features, zone_features, pressure_features],
        axis=1,
    )

    return features[MODEL_FEATURES]


def build_features_from_request(request) -> pd.DataFrame:
    row = {
        "shot_distance": request.shot_distance,
        "shot_angle": request.shot_angle,
        "defender_distance": request.defender_distance,
        "shot_value": request.shot_value,
        "shot_zone": request.shot_zone,
        "pressure_level": request.pressure_level,
    }

    df = pd.DataFrame([row])

    return build_features_from_dataframe(df)