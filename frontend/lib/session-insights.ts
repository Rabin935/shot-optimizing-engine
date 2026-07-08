import {
  BASKET_LOCATION,
  COURT_LENGTH_FT,
  COURT_WIDTH_FT,
  clamp,
  type CourtPoint,
} from "@/utils/courtMath";
import {
  calculateSandboxStats,
  type DefenderPressure,
  type SandboxDefender,
} from "@/utils/shotQuality";
import { getShotZone, type ShotZone } from "@/utils/shotZones";
import type {
  ActiveDefenderCount,
  SharedPressureLevel,
  ShooterPoseState,
  ShotDefenderPosition,
  ShotMetricsState,
  ShotReplayEntry,
} from "@/store/useShotStore";

export type PlayerProfile = {
  baseline: ShooterPoseState;
  id: string;
  name: string;
  tendencies: string[];
};

export type SessionReport = {
  averageContest: number;
  averageEpps: number;
  averageJumpHeight: number;
  averageMakeProbability: number;
  averageReleaseAngle: number;
  bestZone: string;
  mechanicsTrend: "Improving" | "Declining" | "Stable";
  pressureMode: string;
  shotCount: number;
  worstZone: string;
};

export type ExplainableFactor = {
  label: string;
  polarity: "negative" | "positive";
  value: string;
};

export type WhatIfInput = {
  defenderFeetFarther: number;
  releaseAngleDelta: number;
  shooterXDelta: number;
  useSingleDefender: boolean;
};

export type DefenderAIMode =
  | "Blitz"
  | "Double Team"
  | "Drop Coverage"
  | "Help Defense"
  | "Late Closeout"
  | "Switch";

export type PossessionStep =
  | "Catch"
  | "Dribble"
  | "Screen"
  | "Drive"
  | "Kick Out"
  | "Shoot";

export const PLAYER_PROFILES: PlayerProfile[] = [
  {
    baseline: {
      guideHandAngle: 24,
      handHeight: 9.4,
      isAirborne: true,
      jumpHeight: 6.6,
      kneeBend: 22,
      leftLegAngle: 8,
      releaseAngle: 52,
      rightLegAngle: -8,
      shootingArmAngle: 84,
      torsoAngle: 0,
      verticalOffset: 0.95,
    },
    id: "steph-curry",
    name: "Steph Curry",
    tendencies: ["quick dip", "high arc", "elite off-ball balance"],
  },
  {
    baseline: {
      guideHandAngle: 29,
      handHeight: 11.2,
      isAirborne: true,
      jumpHeight: 8.2,
      kneeBend: 18,
      leftLegAngle: 6,
      releaseAngle: 55,
      rightLegAngle: -4,
      shootingArmAngle: 88,
      torsoAngle: -4,
      verticalOffset: 1.18,
    },
    id: "kevin-durant",
    name: "Kevin Durant",
    tendencies: ["high release", "minimal dip", "shoots over contests"],
  },
  {
    baseline: {
      guideHandAngle: 23,
      handHeight: 9.2,
      isAirborne: true,
      jumpHeight: 6,
      kneeBend: 20,
      leftLegAngle: 5,
      releaseAngle: 49,
      rightLegAngle: -5,
      shootingArmAngle: 82,
      torsoAngle: 1,
      verticalOffset: 0.82,
    },
    id: "klay-thompson",
    name: "Klay Thompson",
    tendencies: ["compact base", "fast catch-and-shoot", "repeatable footwork"],
  },
  {
    baseline: {
      guideHandAngle: 28,
      handHeight: 9.1,
      isAirborne: true,
      jumpHeight: 7.8,
      kneeBend: 24,
      leftLegAngle: -10,
      releaseAngle: 51,
      rightLegAngle: 10,
      shootingArmAngle: 86,
      torsoAngle: -7,
      verticalOffset: 1.05,
    },
    id: "damian-lillard",
    name: "Damian Lillard",
    tendencies: ["deep range", "step-back lift", "late-clock shot creation"],
  },
];

export function buildSessionReport(replays: ShotReplayEntry[]): SessionReport {
  if (!replays.length) {
    return {
      averageContest: 0,
      averageEpps: 0,
      averageJumpHeight: 0,
      averageMakeProbability: 0,
      averageReleaseAngle: 0,
      bestZone: "No shots yet",
      mechanicsTrend: "Stable",
      pressureMode: "No pressure data",
      shotCount: 0,
      worstZone: "No shots yet",
    };
  }

  const zoneGroups = groupBy(replays, (replay) => replay.metrics.shotZone);
  const pressureGroups = groupBy(replays, (replay) => replay.metrics.pressureLevel);

  return {
    averageContest: average(
      replays.map((replay) => safeFinite(replay.metrics.closestDefenderDistance)),
    ),
    averageEpps: average(replays.map((replay) => replay.metrics.epps)),
    averageJumpHeight: average(replays.map((replay) => replay.shooterPose.jumpHeight)),
    averageMakeProbability: average(
      replays.map((replay) => replay.metrics.makeProbability),
    ),
    averageReleaseAngle: average(
      replays.map((replay) => replay.shooterPose.releaseAngle),
    ),
    bestZone: pickZone(zoneGroups, "best"),
    mechanicsTrend: getMechanicsTrend(replays),
    pressureMode: pickMostCommon(pressureGroups),
    shotCount: replays.length,
    worstZone: pickZone(zoneGroups, "worst"),
  };
}

export function generateVirtualCoach({
  profile,
  replays,
  report,
}: {
  profile?: PlayerProfile;
  replays: ShotReplayEntry[];
  report: SessionReport;
}) {
  const lines: string[] = [];
  const wingThreeShots = replays.filter((replay) =>
    replay.metrics.shotZone.toLowerCase().includes("three"),
  );
  const wingRelease = average(
    wingThreeShots.map((replay) => replay.shooterPose.handHeight),
  );

  if (wingThreeShots.length >= 2 && wingRelease < 9) {
    lines.push("You consistently release from a lower point on wing threes.");
  }

  if (report.averageJumpHeight < 5.8 && report.shotCount >= 3) {
    lines.push("Your legs are fading across the session; recover your lift before the release.");
  }

  if (report.pressureMode.includes("Tight")) {
    lines.push("You struggle against tight contests; use a drive, screen, or kick-out earlier.");
  }

  if (report.bestZone !== "No shots yet") {
    lines.push(`Your best session value is coming from ${report.bestZone}.`);
  }

  if (profile) {
    lines.push(
      `Compared with ${profile.name}, your next target is matching the ${profile.tendencies[0]} tendency.`,
    );
  }

  if (!lines.length) {
    lines.push("Build a replay sample and the coach will start identifying repeatable patterns.");
  }

  return lines.slice(0, 5);
}

export function compareToProfile({
  profile,
  shooterPose,
}: {
  profile: PlayerProfile;
  shooterPose: ShooterPoseState;
}) {
  const differences = [
    Math.abs(profile.baseline.releaseAngle - shooterPose.releaseAngle) / 18,
    Math.abs(profile.baseline.handHeight - shooterPose.handHeight) / 3,
    Math.abs(profile.baseline.jumpHeight - shooterPose.jumpHeight) / 6,
    Math.abs(profile.baseline.kneeBend - shooterPose.kneeBend) / 26,
    Math.abs(profile.baseline.torsoAngle - shooterPose.torsoAngle) / 24,
  ];
  const similarity = Math.round(
    clamp(100 - average(differences) * 100, 0, 100),
  );

  return {
    handHeightDelta: shooterPose.handHeight - profile.baseline.handHeight,
    jumpDelta: shooterPose.jumpHeight - profile.baseline.jumpHeight,
    releaseDelta: shooterPose.releaseAngle - profile.baseline.releaseAngle,
    similarity,
  };
}

export function applyFatigue({
  possessionIndex,
  shooterPose,
}: {
  possessionIndex: number;
  shooterPose: ShooterPoseState;
}): ShooterPoseState {
  const fatigue = clamp(possessionIndex / 100, 0, 1);

  return {
    ...shooterPose,
    handHeight: Math.max(6.8, shooterPose.handHeight - fatigue * 1.4),
    jumpHeight: Math.max(0, shooterPose.jumpHeight - fatigue * 4.2),
    kneeBend: Math.max(8, shooterPose.kneeBend - fatigue * 10),
    releaseAngle: shooterPose.releaseAngle - fatigue * 4,
    shootingArmAngle: shooterPose.shootingArmAngle - fatigue * 5,
    torsoAngle: shooterPose.torsoAngle + fatigue * 9,
    verticalOffset: Math.max(0, shooterPose.verticalOffset - fatigue * 0.55),
  };
}

export function getFatiguePenalty(possessionIndex: number) {
  return clamp(possessionIndex / 100, 0, 1) * 0.18;
}

export function getDefenderAIPositions({
  defenders,
  mode,
  shooter,
}: {
  defenders: ShotDefenderPosition[];
  mode: DefenderAIMode;
  shooter: CourtPoint;
}) {
  const primary = defenders[0] ?? { id: "d1", x: shooter.x - 3, y: shooter.y - 2 };
  const secondary = defenders[1] ?? { id: "d2", x: shooter.x + 6, y: shooter.y + 2 };
  const targetMap: Record<DefenderAIMode, ShotDefenderPosition[]> = {
    Blitz: [
      { ...primary, x: shooter.x - 1.2, y: shooter.y - 0.8 },
      { ...secondary, x: shooter.x + 1.4, y: shooter.y - 0.4 },
    ],
    "Double Team": [
      { ...primary, x: shooter.x - 1.6, y: shooter.y - 1.1 },
      { ...secondary, x: shooter.x + 1.8, y: shooter.y + 0.9 },
    ],
    "Drop Coverage": [
      { ...primary, x: BASKET_LOCATION.x - 2.5, y: BASKET_LOCATION.y + 7 },
      { ...secondary, x: shooter.x + 8, y: shooter.y + 4 },
    ],
    "Help Defense": [
      { ...primary, x: shooter.x - 3.2, y: shooter.y - 2.4 },
      { ...secondary, x: BASKET_LOCATION.x + 5, y: BASKET_LOCATION.y + 8 },
    ],
    "Late Closeout": [
      { ...primary, x: shooter.x - 5.8, y: shooter.y - 3.8 },
      { ...secondary, x: secondary.x, y: secondary.y },
    ],
    Switch: [
      { ...primary, x: shooter.x + 2.7, y: shooter.y - 1.7 },
      { ...secondary, x: shooter.x - 4.5, y: shooter.y + 1.2 },
    ],
  };

  return targetMap[mode].map((defender) => ({
    ...defender,
    x: clamp(defender.x, 0, COURT_WIDTH_FT),
    y: clamp(defender.y, 0, COURT_LENGTH_FT),
  }));
}

export function evaluatePossession({
  baseEpps,
  steps,
}: {
  baseEpps: number;
  steps: PossessionStep[];
}) {
  const effects: Record<PossessionStep, number> = {
    Catch: 0.01,
    Dribble: -0.02,
    Screen: 0.08,
    Drive: 0.06,
    "Kick Out": 0.11,
    Shoot: 0,
  };
  const sequenceValue = steps.reduce((sum, step) => sum + effects[step], baseEpps);

  return {
    epps: Math.max(0, sequenceValue),
    explanation:
      steps.includes("Drive") && steps.includes("Kick Out")
        ? "Drive-and-kick creates the strongest full-possession advantage."
        : steps.includes("Screen")
          ? "The screen improves separation before the shot."
          : "This possession is mostly a direct-shot sequence.",
  };
}

export function explainPrediction({
  metrics,
}: {
  metrics: Pick<
    ShotMetricsState,
    | "closestDefenderDistance"
    | "epps"
    | "makeProbability"
    | "pressureLevel"
    | "shotDistance"
    | "shotValue"
    | "shotZone"
  >;
}) {
  const factors: ExplainableFactor[] = [];

  if (metrics.pressureLevel.includes("Open")) {
    factors.push({ label: "Open spacing", polarity: "positive", value: "+ spacing" });
  } else {
    factors.push({ label: "Defender close", polarity: "negative", value: "- pressure" });
  }

  if (metrics.shotValue === 3) {
    factors.push({ label: "Three-point shot value", polarity: "positive", value: "+ value" });
  }

  if (metrics.shotDistance > 23) {
    factors.push({ label: "Long distance", polarity: "negative", value: "- range" });
  }

  if (metrics.closestDefenderDistance >= 6) {
    factors.push({ label: "Clean release window", polarity: "positive", value: "+ window" });
  }

  return factors;
}

export function runWhatIfScenario({
  activeDefenderCount,
  defenders,
  input,
  shooter,
}: {
  activeDefenderCount: ActiveDefenderCount;
  defenders: ShotDefenderPosition[];
  input: WhatIfInput;
  shooter: CourtPoint;
}) {
  const movedShooter = {
    x: clamp(shooter.x + input.shooterXDelta, 0, COURT_WIDTH_FT),
    y: shooter.y,
  };
  const activeCount = input.useSingleDefender ? 1 : activeDefenderCount;
  const movedDefenders = defenders.slice(0, activeCount).map((defender) => {
    const dx = defender.x - movedShooter.x;
    const dy = defender.y - movedShooter.y;
    const length = Math.max(Math.sqrt(dx * dx + dy * dy), 0.1);

    return {
      ...defender,
      x: clamp(defender.x + (dx / length) * input.defenderFeetFarther, 0, COURT_WIDTH_FT),
      y: clamp(defender.y + (dy / length) * input.defenderFeetFarther, 0, COURT_LENGTH_FT),
    };
  });
  const stats = calculateStatsFromCourt(movedShooter, movedDefenders);
  const releaseBonus = input.releaseAngleDelta * 0.006;
  const makeProbability = clamp(stats.makeProbability + releaseBonus, 0.1, 0.82);

  return {
    epps: makeProbability * stats.shotValue,
    makeProbability,
    pressure: stats.defenderPressure,
    shotZone: stats.shotZone,
  };
}

export function generateEppsMap({
  defenders,
}: {
  defenders: ShotDefenderPosition[];
}) {
  const points: Array<CourtPoint & { epps: number; quality: "Excellent" | "Good" | "Poor"; zone: ShotZone }> = [];

  for (let y = 4; y <= COURT_LENGTH_FT; y += 4.5) {
    for (let x = 2; x <= COURT_WIDTH_FT; x += 4.5) {
      const point = { x, y };
      const stats = calculateStatsFromCourt(point, defenders);
      const quality =
        stats.expectedPoints >= 1.12
          ? "Excellent"
          : stats.expectedPoints >= 0.92
            ? "Good"
            : "Poor";

      points.push({
        ...point,
        epps: stats.expectedPoints,
        quality,
        zone: getShotZone(point),
      });
    }
  }

  return points;
}

export function buildResearchSummary(replays: ShotReplayEntry[]) {
  const report = buildSessionReport(replays);
  const scoreBuckets = {
    elite: replays.filter((replay) => replay.mechanicsScore.overallForm >= 85).length,
    good: replays.filter(
      (replay) =>
        replay.mechanicsScore.overallForm >= 70 &&
        replay.mechanicsScore.overallForm < 85,
    ).length,
    needsWork: replays.filter((replay) => replay.mechanicsScore.overallForm < 70).length,
  };

  return {
    ...report,
    heatmapShots: replays.map((replay) => ({
      epps: replay.metrics.epps,
      x: replay.shooter.x,
      y: replay.shooter.y,
      zone: replay.metrics.shotZone,
    })),
    scoreBuckets,
  };
}

export function pressureToSharedPressure(pressure: DefenderPressure): SharedPressureLevel {
  if (pressure === "Moderate") {
    return "Open";
  }

  return pressure;
}

function calculateStatsFromCourt(
  shooter: CourtPoint,
  defenders: ShotDefenderPosition[],
) {
  const sandboxDefenders: SandboxDefender[] = defenders.map((defender, index) => ({
    id: defender.id,
    label: `Defender ${index + 1}`,
    point: defender,
    tone: index === 0 ? "red" : "blue",
  }));

  return calculateSandboxStats(shooter, sandboxDefenders);
}

function getMechanicsTrend(replays: ShotReplayEntry[]) {
  if (replays.length < 3) {
    return "Stable";
  }

  const chronological = [...replays].reverse();
  const split = Math.floor(chronological.length / 2);
  const early = average(
    chronological.slice(0, split).map((replay) => replay.mechanicsScore.overallForm),
  );
  const late = average(
    chronological.slice(split).map((replay) => replay.mechanicsScore.overallForm),
  );

  if (late - early > 4) {
    return "Improving";
  }

  if (early - late > 4) {
    return "Declining";
  }

  return "Stable";
}

function pickZone(
  zoneGroups: Record<string, ShotReplayEntry[]>,
  direction: "best" | "worst",
) {
  const entries = Object.entries(zoneGroups);

  if (!entries.length) {
    return "No shots yet";
  }

  return entries.reduce((selected, current) => {
    const selectedValue = average(selected[1].map((replay) => replay.metrics.epps));
    const currentValue = average(current[1].map((replay) => replay.metrics.epps));

    return direction === "best"
      ? currentValue > selectedValue
        ? current
        : selected
      : currentValue < selectedValue
        ? current
        : selected;
  })[0];
}

function pickMostCommon(groups: Record<string, ShotReplayEntry[]>) {
  const entries = Object.entries(groups);

  if (!entries.length) {
    return "No pressure data";
  }

  return entries.reduce((selected, current) =>
    current[1].length > selected[1].length ? current : selected,
  )[0];
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getKey(item);

    return {
      ...groups,
      [key]: [...(groups[key] ?? []), item],
    };
  }, {});
}

function average(values: number[]) {
  const validValues = values.filter(Number.isFinite);

  if (!validValues.length) {
    return 0;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function safeFinite(value: number) {
  return Number.isFinite(value) ? value : 12;
}
