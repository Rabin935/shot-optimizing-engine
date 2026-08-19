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
  period?: number;
  shot_clock?: number;
  dribbles?: number;
  touch_time?: number;
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
const CACHE_TTL_MS = 30_000;
const responseCache = new Map<
  string,
  { expiresAt: number; value: ShotPredictionResponse }
>();
const pendingRequests = new Map<string, Promise<ShotPredictionResponse>>();

export async function predictShot(
  data: ShotPredictionRequest,
  options: PredictShotOptions = {},
): Promise<ShotPredictionResponse> {
  const cacheKey = JSON.stringify(data);
  const cached = responseCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const pending = pendingRequests.get(cacheKey);

  if (pending) {
    return pending;
  }

  const request = fetch(`${API_URL}/api/predict-shot`, {
      body: JSON.stringify(data),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: options.signal,
    })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Shot prediction failed with status ${response.status}`);
      }

      const value = (await response.json()) as ShotPredictionResponse;

      responseCache.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        value,
      });

      return value;
    })
    .finally(() => {
      pendingRequests.delete(cacheKey);
    });

  pendingRequests.set(cacheKey, request);

  return request;
}
