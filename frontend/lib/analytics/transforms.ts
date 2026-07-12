import type {
  AnalyticsFilterState,
  AnalyticsPressureLevel,
  AnalyticsShot,
  AnalyticsShotZone,
  HeatmapRegion,
  MechanicsDatum,
  ModelPerformanceDatum,
  OptimizerComparisonDatum,
  PressureDatum,
  StatSummary,
  TrendPoint,
  TrendWindow,
  ZonePerformanceDatum,
  ZoneSortMetric,
} from "@/types/charts";
import type {
  OptimizedShotState,
  PredictionSource,
  ShooterPoseState,
  ShotMetricsState,
  ShotPoint,
  ShotReplayEntry,
} from "@/store/useShotStore";

export const ANALYTICS_ZONE_ORDER: AnalyticsShotZone[] = [
  "Paint",
  "Mid Range",
  "Corner Three",
  "Wing Three",
  "Top Three",
];

export const ANALYTICS_PRESSURE_ORDER: AnalyticsPressureLevel[] = [
  "Very Open",
  "Open",
  "Moderate",
  "Tight",
  "Very Tight",
];

const EMPTY_SUMMARY: StatSummary = {
  averageEpps: 0,
  averageMakeProbability: 0,
  highestEpps: 0,
  lowestEpps: 0,
  shotCount: 0,
};

export function replayHistoryToAnalyticsShots(
  replays: ShotReplayEntry[],
): AnalyticsShot[] {
  // Replay history is persisted newest-first, so reverse it for chart timelines.
  return [...replays].reverse().map((replay, index) =>
    replayToAnalyticsShot(replay, index + 1),
  );
}

export function applyAnalyticsFilters(
  shots: AnalyticsShot[],
  filters: AnalyticsFilterState,
) {
  // One predicate keeps every analytics chart aligned to the same global filter state.
  return shots.filter((shot) => {
    const createdAt = new Date(shot.createdAt);
    const afterStart =
      !filters.dateFrom || createdAt >= new Date(`${filters.dateFrom}T00:00:00`);
    const beforeEnd =
      !filters.dateTo || createdAt <= new Date(`${filters.dateTo}T23:59:59`);
    const searchText = `${shot.zone} ${shot.pressure} ${shot.sessionId} ${shot.predictionSource}`
      .toLowerCase();
    const query = filters.searchQuery.trim().toLowerCase();

    return (
      (filters.shotZone === "all" || shot.zone === filters.shotZone) &&
      (filters.pressureLevel === "all" || shot.pressure === filters.pressureLevel) &&
      (filters.shotValue === "all" || String(shot.shotValue) === filters.shotValue) &&
      (filters.predictionSource === "all" ||
        shot.predictionSource === filters.predictionSource) &&
      (!filters.sessionId || shot.sessionId === filters.sessionId) &&
      (!query || searchText.includes(query)) &&
      shot.epps >= filters.eppsMin &&
      shot.epps <= filters.eppsMax &&
      shot.makeProbability >= filters.makeProbabilityMin &&
      shot.makeProbability <= filters.makeProbabilityMax &&
      shot.mechanicsScore >= filters.mechanicsScoreMin &&
      shot.mechanicsScore <= filters.mechanicsScoreMax &&
      afterStart &&
      beforeEnd
    );
  });
}

export function metricsToAnalyticsShot({
  createdAt,
  id,
  mechanicsScore,
  metrics,
  shotNumber,
  shooter,
}: {
  createdAt: string;
  id: string;
  mechanicsScore: number;
  metrics: ShotMetricsState;
  shotNumber: number;
  shooter: ShotPoint;
}): AnalyticsShot {
  const zone = normalizeZone(metrics, shooter);

  return {
    armAlignment: mechanicsScore,
    balance: mechanicsScore,
    contestHandling: mechanicsScore,
    createdAt,
    distance: metrics.shotDistance,
    epps: metrics.epps,
    footwork: mechanicsScore,
    id,
    jumpTiming: mechanicsScore,
    landing: mechanicsScore,
    makeProbability: metrics.makeProbability,
    mechanicsScore,
    metrics,
    predictionSource: metrics.predictionSource,
    pressure: normalizePressure(metrics.pressureLevel),
    release: mechanicsScore,
    sessionId: getSessionId(createdAt),
    shotNumber,
    shotValue: metrics.shotValue,
    shooter,
    zone,
  };
}

export function buildTrendSeries(
  shots: AnalyticsShot[],
  windowSize: TrendWindow,
): TrendPoint[] {
  const limitedShots =
    windowSize === "all" ? shots : shots.slice(Math.max(0, shots.length - windowSize));

  return limitedShots.map((shot) => ({
    epps: shot.epps,
    makeProbability: shot.makeProbability,
    pressure: shot.pressure,
    shotNumber: shot.shotNumber,
    zone: shot.zone,
  }));
}

export function buildStatSummary(shots: AnalyticsShot[]): StatSummary {
  if (!shots.length) {
    return EMPTY_SUMMARY;
  }

  return {
    averageEpps: average(shots.map((shot) => shot.epps)),
    averageMakeProbability: average(shots.map((shot) => shot.makeProbability)),
    highestEpps: Math.max(...shots.map((shot) => shot.epps)),
    lowestEpps: Math.min(...shots.map((shot) => shot.epps)),
    shotCount: shots.length,
  };
}

export function buildZonePerformance(
  shots: AnalyticsShot[],
  sortBy: ZoneSortMetric,
): ZonePerformanceDatum[] {
  const zoneRows = ANALYTICS_ZONE_ORDER.map((zone) => {
    const zoneShots = shots.filter((shot) => shot.zone === zone);

    return {
      attempts: zoneShots.length,
      averageEpps: average(zoneShots.map((shot) => shot.epps)),
      averageMakeProbability: average(zoneShots.map((shot) => shot.makeProbability)),
      averageMechanicsScore: average(zoneShots.map((shot) => shot.mechanicsScore)),
      averagePressure: average(zoneShots.map((shot) => pressureToScore(shot.pressure))),
      isBest: false,
      zone,
    };
  });
  const bestEpps = Math.max(...zoneRows.map((row) => row.averageEpps));

  return zoneRows
    .map((row) => ({ ...row, isBest: row.attempts > 0 && row.averageEpps === bestEpps }))
    .sort((a, b) => {
      if (sortBy === "attempts") {
        return b.attempts - a.attempts;
      }

      if (sortBy === "probability") {
        return b.averageMakeProbability - a.averageMakeProbability;
      }

      return b.averageEpps - a.averageEpps;
    });
}

export function buildPressureAnalytics(shots: AnalyticsShot[]): PressureDatum[] {
  return ANALYTICS_PRESSURE_ORDER.map((pressure) => {
    const pressureShots = shots.filter((shot) => shot.pressure === pressure);

    return {
      averageEpps: average(pressureShots.map((shot) => shot.epps)),
      count: pressureShots.length,
      pressure,
    };
  });
}

export function buildMechanicsAnalytics(shots: AnalyticsShot[]): MechanicsDatum[] {
  return [
    { metric: "Balance", score: average(shots.map((shot) => shot.balance)) },
    { metric: "Footwork", score: average(shots.map((shot) => shot.footwork)) },
    { metric: "Release", score: average(shots.map((shot) => shot.release)) },
    { metric: "Jump Timing", score: average(shots.map((shot) => shot.jumpTiming)) },
    { metric: "Arm Alignment", score: average(shots.map((shot) => shot.armAlignment)) },
    {
      metric: "Contest Handling",
      score: average(shots.map((shot) => shot.contestHandling)),
    },
    { metric: "Landing", score: average(shots.map((shot) => shot.landing)) },
  ];
}

export function buildOptimizerComparison({
  currentMetrics,
  currentMechanics,
  optimizedShot,
  shooterPose,
}: {
  currentMechanics: number;
  currentMetrics: ShotMetricsState;
  optimizedShot: OptimizedShotState | null;
  shooterPose: ShooterPoseState;
}): OptimizerComparisonDatum[] {
  const recommendedEpps = optimizedShot?.epps ?? currentMetrics.epps * 1.08;
  const recommendedProbability =
    optimizedShot?.makeProbability ?? Math.min(currentMetrics.makeProbability + 0.05, 0.78);
  const recommendedPressure = pressureToScore(
    normalizePressure(optimizedShot?.pressureLevel ?? currentMetrics.pressureLevel),
  );

  return [
    { current: currentMetrics.epps, metric: "EPPS", recommendation: recommendedEpps },
    {
      current: currentMetrics.makeProbability,
      metric: "Make Probability",
      recommendation: recommendedProbability,
    },
    {
      current: currentMechanics,
      metric: "Mechanics Score",
      recommendation: Math.min(currentMechanics + 7, 100),
    },
    {
      current: pressureToScore(normalizePressure(currentMetrics.pressureLevel)),
      metric: "Pressure",
      recommendation: recommendedPressure,
    },
    {
      current: currentMetrics.shotDistance,
      metric: "Distance",
      recommendation: Math.max(currentMetrics.shotDistance - shooterPose.jumpHeight * 0.12, 0),
    },
  ];
}

export function buildModelPerformance(shots: AnalyticsShot[]): ModelPerformanceDatum[] {
  const sources = Array.from(new Set(shots.map((shot) => shot.predictionSource)));

  return sources.map((source) => {
    const sourceShots = shots.filter((shot) => shot.predictionSource === source);

    return {
      averageConfidence: estimateConfidence(source, sourceShots),
      count: sourceShots.length,
      responseTime: source === "ml_model" ? 118 : source === "rule_based_fallback" ? 32 : 18,
      source,
    };
  });
}

export function buildHeatmapRegions(shots: AnalyticsShot[]): HeatmapRegion[] {
  const groups = groupBy(shots, (shot) => `${Math.round(shot.shooter.x / 5) * 5}-${Math.round(shot.shooter.y / 5) * 5}`);

  return Object.entries(groups).map(([id, regionShots]) => {
    const firstShot = regionShots[0];

    return {
      averageEpps: average(regionShots.map((shot) => shot.epps)),
      averageMakeProbability: average(regionShots.map((shot) => shot.makeProbability)),
      attempts: regionShots.length,
      id,
      label: `${firstShot.zone} cluster`,
      pressure: firstShot.pressure,
      x: average(regionShots.map((shot) => shot.shooter.x)),
      y: average(regionShots.map((shot) => shot.shooter.y)),
      zone: firstShot.zone,
    };
  });
}

export function getBestByEpps(shots: AnalyticsShot[]) {
  return shots.reduce<AnalyticsShot | null>(
    (best, shot) => (!best || shot.epps > best.epps ? shot : best),
    null,
  );
}

export function getWorstByEpps(shots: AnalyticsShot[]) {
  return shots.reduce<AnalyticsShot | null>(
    (worst, shot) => (!worst || shot.epps < worst.epps ? shot : worst),
    null,
  );
}

export function getMostCommonPressure(pressureRows: PressureDatum[]) {
  return pressureRows.reduce<PressureDatum | null>(
    (selected, row) => (!selected || row.count > selected.count ? row : selected),
    null,
  );
}

export function getBestPressure(pressureRows: PressureDatum[]) {
  return pressureRows.reduce<PressureDatum | null>(
    (selected, row) =>
      row.count > 0 && (!selected || row.averageEpps > selected.averageEpps)
        ? row
        : selected,
    null,
  );
}

export function getWorstPressure(pressureRows: PressureDatum[]) {
  return pressureRows.reduce<PressureDatum | null>(
    (selected, row) =>
      row.count > 0 && (!selected || row.averageEpps < selected.averageEpps)
        ? row
        : selected,
    null,
  );
}

export function normalizePressure(pressure: string): AnalyticsPressureLevel {
  if (pressure === "Very Tight") {
    return "Very Tight";
  }

  if (pressure === "Tight") {
    return "Tight";
  }

  if (pressure === "Moderate") {
    return "Moderate";
  }

  if (pressure === "Very Open") {
    return "Very Open";
  }

  return "Open";
}

export function normalizeZone(
  metrics: Pick<ShotMetricsState, "shotDistance" | "shotValue" | "shotZone">,
  shooter: ShotPoint,
): AnalyticsShotZone {
  if (metrics.shotDistance <= 9 || metrics.shotZone === "Paint") {
    return "Paint";
  }

  if (metrics.shotValue === 2) {
    return "Mid Range";
  }

  if (shooter.y <= 14 && (shooter.x <= 9 || shooter.x >= 41)) {
    return "Corner Three";
  }

  if (shooter.x >= 18 && shooter.x <= 32) {
    return "Top Three";
  }

  return "Wing Three";
}

export function pressureToScore(pressure: AnalyticsPressureLevel) {
  return {
    "Very Open": 1,
    Open: 2,
    Moderate: 3,
    Tight: 4,
    "Very Tight": 5,
  }[pressure];
}

function replayToAnalyticsShot(replay: ShotReplayEntry, shotNumber: number): AnalyticsShot {
  const mechanics = replay.mechanicsScore;
  const mechanicsScore = mechanics.overallForm;

  return {
    armAlignment: estimateArmAlignment(replay.shooterPose),
    balance: mechanics.balance,
    contestHandling: mechanics.contestHandling,
    createdAt: replay.createdAt,
    distance: replay.metrics.shotDistance,
    epps: replay.metrics.epps,
    footwork: mechanics.footwork,
    id: replay.id,
    jumpTiming: mechanics.jumpTiming,
    landing: estimateLanding(replay.shooterPose),
    makeProbability: replay.metrics.makeProbability,
    mechanicsScore,
    metrics: replay.metrics,
    predictionSource: replay.metrics.predictionSource,
    pressure: normalizePressure(replay.metrics.pressureLevel),
    release: mechanics.release,
    replay,
    sessionId: getSessionId(replay.createdAt),
    shotNumber,
    shotValue: replay.metrics.shotValue,
    shooter: replay.shooter,
    zone: normalizeZone(replay.metrics, replay.shooter),
  };
}

function estimateArmAlignment(pose: ShooterPoseState) {
  // The simulator does not store arm alignment yet, so derive it from release mechanics.
  const guideHand = scoreDistance(pose.guideHandAngle, 28, 24);
  const shootingArm = scoreDistance(pose.shootingArmAngle, 82, 26);

  return Math.round((guideHand * 0.42 + shootingArm * 0.58) * 100);
}

function estimateLanding(pose: ShooterPoseState) {
  // Landing quality favors vertical balance and controlled leg symmetry.
  const torso = scoreDistance(Math.abs(pose.torsoAngle), 0, 18);
  const legs = scoreDistance(Math.abs(pose.leftLegAngle + pose.rightLegAngle), 0, 24);

  return Math.round((torso * 0.55 + legs * 0.45) * 100);
}

function estimateConfidence(source: PredictionSource, shots: AnalyticsShot[]) {
  if (!shots.length) {
    return 0;
  }

  const sourceBaseline = {
    local_estimate: 0.68,
    ml_model: 0.86,
    prediction_engine: 0.78,
    rule_based_fallback: 0.62,
  }[source];

  return Math.min(sourceBaseline + average(shots.map((shot) => shot.makeProbability)) * 0.08, 0.97);
}

function scoreDistance(value: number, target: number, falloff: number) {
  return Math.max(0, 1 - Math.abs(value - target) / falloff);
}

function getSessionId(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "session-unknown";
  }

  return date.toISOString().slice(0, 10);
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getKey(item);

    groups[key] ??= [];
    groups[key].push(item);
    return groups;
  }, {});
}

function average(values: number[]) {
  const validValues = values.filter(Number.isFinite);

  if (!validValues.length) {
    return 0;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}
