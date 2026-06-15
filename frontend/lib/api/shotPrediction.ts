export type ShotPredictionRequest = {
  shooter_x: number;
  shooter_y: number;
  defender_x: number;
  defender_y: number;
  shot_distance: number;
  shot_angle: number;
  shot_zone: string;
  defender_distance: number;
  pressure_level: string;
  shot_value: 2 | 3;
};

export type ShotPredictionResponse = {
  make_probability: number;
  make_probability_percent: string;
  shot_value: 2 | 3;
  epps: number;
  shot_quality: string;
  recommendation: string;
  confidence: string;
  prediction_source?: "ml_model" | "rule_based_fallback" | string;
};

type PredictShotOptions = {
  signal?: AbortSignal;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function predictShot(
  data: ShotPredictionRequest,
  options: PredictShotOptions = {},
): Promise<ShotPredictionResponse> {
  // Send one shot context payload to the FastAPI prediction endpoint.
  const response = await fetch(`${API_URL}/api/predict-shot`, {
    body: JSON.stringify(data),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    signal: options.signal,
  });

  if (!response.ok) {
    // Surface backend failures to the hook so it can show offline/fallback state.
    throw new Error(`Shot prediction failed with status ${response.status}`);
  }

  // The backend response already matches ShotPredictionResponse.
  return response.json() as Promise<ShotPredictionResponse>;
}
