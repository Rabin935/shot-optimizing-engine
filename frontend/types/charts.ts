import type {
  PredictionSource,
  ShotMetricsState,
  ShotPoint,
  ShotReplayEntry,
} from "@/store/useShotStore";

export type AnalyticsShotZone =
  | "Paint"
  | "Mid Range"
  | "Corner Three"
  | "Wing Three"
  | "Top Three";

export type AnalyticsPressureLevel =
  | "Very Open"
  | "Open"
  | "Moderate"
  | "Tight"
  | "Very Tight";

export type TrendWindow = 10 | 25 | 50 | "all";

export type ZoneSortMetric = "attempts" | "epps" | "probability";

export type AnalyticsFilterState = {
  dateFrom: string;
  dateTo: string;
  mechanicsScoreMax: number;
  mechanicsScoreMin: number;
  predictionSource: "all" | PredictionSource;
  pressureLevel: "all" | AnalyticsPressureLevel;
  sessionId: string;
  shotValue: "all" | "2" | "3";
  shotZone: "all" | AnalyticsShotZone;
};

export type AnalyticsShot = {
  armAlignment: number;
  balance: number;
  contestHandling: number;
  createdAt: string;
  distance: number;
  epps: number;
  footwork: number;
  id: string;
  jumpTiming: number;
  landing: number;
  makeProbability: number;
  mechanicsScore: number;
  metrics: ShotMetricsState;
  predictionSource: PredictionSource;
  pressure: AnalyticsPressureLevel;
  release: number;
  replay?: ShotReplayEntry;
  sessionId: string;
  shotNumber: number;
  shotValue: 2 | 3;
  shooter: ShotPoint;
  zone: AnalyticsShotZone;
};

export type TrendPoint = {
  epps: number;
  makeProbability: number;
  pressure: AnalyticsPressureLevel;
  shotNumber: number;
  zone: AnalyticsShotZone;
};

export type StatSummary = {
  averageEpps: number;
  averageMakeProbability: number;
  highestEpps: number;
  lowestEpps: number;
  shotCount: number;
};

export type ZonePerformanceDatum = {
  attempts: number;
  averageEpps: number;
  averageMakeProbability: number;
  averageMechanicsScore: number;
  averagePressure: number;
  isBest: boolean;
  zone: AnalyticsShotZone;
};

export type PressureDatum = {
  averageEpps: number;
  count: number;
  pressure: AnalyticsPressureLevel;
};

export type MechanicsDatum = {
  metric: string;
  score: number;
};

export type OptimizerComparisonDatum = {
  current: number;
  metric: string;
  recommendation: number;
};

export type ModelPerformanceDatum = {
  averageConfidence: number;
  count: number;
  responseTime: number;
  source: PredictionSource;
};

export type HeatmapRegion = {
  averageEpps: number;
  averageMakeProbability: number;
  attempts: number;
  id: string;
  label: string;
  pressure: AnalyticsPressureLevel;
  x: number;
  y: number;
  zone: AnalyticsShotZone;
};
