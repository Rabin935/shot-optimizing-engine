import {
  BASKET_LOCATION,
  calculateDistance,
  clamp,
  type CourtPoint,
} from "@/utils/courtMath";
import {
  getShotValue,
  getShotZone,
  isThreePointZone,
  type ShotType,
  type ShotZone,
} from "@/utils/shotZones";

export type DefenderPressure =
  | "Very Tight"
  | "Tight"
  | "Moderate"
  | "Open"
  | "Very Open";

export type ShotQuality = "Excellent" | "Good" | "Average" | "Poor" | "Bad";

export type SandboxDefender = {
  id: string;
  label: string;
  point: CourtPoint;
  tone: "red" | "blue";
};

export type DefenderDistance = SandboxDefender & {
  distance: number;
};

export type ShotRecommendation = {
  message: string;
  title: string;
  tone: "green" | "orange" | "red" | "sky";
};

export type SandboxStats = {
  baseMakeProbability: number;
  closestDefenderDistance: number;
  closestDefenderId: string | null;
  defenderDistances: DefenderDistance[];
  defenderPressure: DefenderPressure;
  distanceToBasket: number;
  expectedPoints: number;
  makeProbability: number;
  pressurePenalty: number;
  recommendation: ShotRecommendation;
  shotQuality: ShotQuality;
  shotType: ShotType;
  shotValue: 2 | 3;
  shotZone: ShotZone;
  spacingAdjustment: number;
};

type RecommendationInput = Omit<SandboxStats, "recommendation">;

export function getDefenderPressure(distance: number): DefenderPressure {
  // Translate closest-defender distance into a readable pressure label.
  if (!Number.isFinite(distance)) {
    return "Very Open";
  }

  if (distance <= 2.25) {
    return "Very Tight";
  }

  if (distance <= 4) {
    return "Tight";
  }

  if (distance <= 6) {
    return "Moderate";
  }

  if (distance <= 8.5) {
    return "Open";
  }

  return "Very Open";
}

export function getShotQuality(expectedPoints: number): ShotQuality {
  // Convert EPPS into the quality label shown throughout the UI.
  if (expectedPoints >= 1.25) {
    return "Excellent";
  }

  if (expectedPoints >= 1.05) {
    return "Good";
  }

  if (expectedPoints >= 0.85) {
    return "Average";
  }

  if (expectedPoints >= 0.68) {
    return "Poor";
  }

  return "Bad";
}

export function calculateSandboxStats(
  shooter: CourtPoint,
  defenders: SandboxDefender[],
): SandboxStats {
  // Calculate all local sandbox analytics from the current shooter and defenders.
  const distanceToBasket = calculateDistance(shooter, BASKET_LOCATION);
  const shotZone = getShotZone(shooter);
  const shotType: ShotType = isThreePointZone(shotZone) ? "3PT" : "2PT";
  const shotValue = getShotValue(shotZone);
  const defenderDistances = defenders.map((defender) => ({
    ...defender,
    distance: calculateDistance(shooter, defender.point),
  }));
  // Pick the closest defender because that defender drives the pressure model.
  const closestDefender = defenderDistances.reduce<DefenderDistance | null>(
    (closest, defender) => {
      if (!closest || defender.distance < closest.distance) {
        return defender;
      }

      return closest;
    },
    null,
  );
  const closestDefenderDistance =
    closestDefender?.distance ?? Number.POSITIVE_INFINITY;
  // Combine shot zone, pressure, and spacing into a local probability estimate.
  const defenderPressure = getDefenderPressure(closestDefenderDistance);
  const baseMakeProbability = getBaseMakeProbability(shotZone, distanceToBasket);
  const pressurePenalty = getPressurePenalty(defenderPressure);
  const spacingAdjustment = getSpacingAdjustment(
    shotZone,
    defenderPressure,
    distanceToBasket,
  );
  const makeProbability = clamp(
    baseMakeProbability - pressurePenalty + spacingAdjustment,
    getProbabilityFloor(shotZone),
    getProbabilityCeiling(shotZone),
  );
  const expectedPoints = makeProbability * shotValue;
  const shotQuality = getShotQuality(expectedPoints);
  // Build stats first, then attach recommendation derived from those stats.
  const statsWithoutRecommendation: RecommendationInput = {
    baseMakeProbability,
    closestDefenderDistance,
    closestDefenderId: closestDefender?.id ?? null,
    defenderDistances,
    defenderPressure,
    distanceToBasket,
    expectedPoints,
    makeProbability,
    pressurePenalty,
    shotQuality,
    shotType,
    shotValue,
    shotZone,
    spacingAdjustment,
  };

  return {
    ...statsWithoutRecommendation,
    recommendation: getShotRecommendation(statsWithoutRecommendation),
  };
}

export function getShotRecommendation(
  stats: RecommendationInput,
): ShotRecommendation {
  // Convert numeric shot context into short coaching feedback.
  const isOpenLook =
    stats.defenderPressure === "Open" ||
    stats.defenderPressure === "Very Open";

  if (
    stats.shotZone === "Corner Three" &&
    isOpenLook &&
    stats.expectedPoints >= 1.1
  ) {
    return {
      message: "The corner spacing is clean and the shot value is doing real work.",
      title: "High-value shot: Open corner three",
      tone: "green",
    };
  }

  if (stats.defenderPressure === "Very Tight") {
    return {
      message: "The release window is crowded. Step back, relocate, or move the ball.",
      title: "Better option: Step back for more space",
      tone: "red",
    };
  }

  if (stats.shotZone === "Mid-Range" && !isOpenLook) {
    return {
      message: "The expected return is dragged down by both shot value and pressure.",
      title: "Poor shot: Tight contested mid-range",
      tone: "red",
    };
  }

  if (stats.shotZone === "Mid-Range" && isOpenLook) {
    return {
      message: "Usable if it is in rhythm, but a paint touch or open three is stronger.",
      title: "Acceptable look: Open mid-range",
      tone: "orange",
    };
  }

  if (isThreePointZone(stats.shotZone) && !isOpenLook) {
    return {
      message: "A hard closeout lowers the three enough to favor a drive or extra pass.",
      title: "Better option: Attack the closeout",
      tone: "orange",
    };
  }

  if (stats.shotZone === "Paint" && stats.expectedPoints >= 1.15) {
    return {
      message: "This is the kind of interior touch that usually beats the model baseline.",
      title: "High-value shot: Finish at the rim",
      tone: "green",
    };
  }

  if (stats.shotQuality === "Bad") {
    return {
      message: "Reset the possession and hunt a cleaner angle before shooting.",
      title: "Low-value attempt: Reset",
      tone: "red",
    };
  }

  return {
    message: "The look is playable. A little more separation would lift the EPPS.",
    title: "Balanced look: Improve spacing",
    tone: "sky",
  };
}

function getBaseMakeProbability(zone: ShotZone, distance: number) {
  // Estimate baseline make probability before defender pressure adjustments.
  if (zone === "Paint") {
    return clamp(0.76 - Math.max(0, distance - 2.5) * 0.026, 0.52, 0.78);
  }

  if (zone === "Mid-Range") {
    return clamp(0.48 - Math.max(0, distance - 9) * 0.009, 0.34, 0.5);
  }

  if (zone === "Corner Three") {
    return clamp(0.405 - Math.max(0, distance - 22) * 0.004, 0.34, 0.43);
  }

  if (zone === "Wing Three") {
    return clamp(0.38 - Math.max(0, distance - 23.75) * 0.006, 0.3, 0.4);
  }

  return clamp(0.365 - Math.max(0, distance - 23.75) * 0.006, 0.29, 0.39);
}

function getPressurePenalty(pressure: DefenderPressure) {
  // Tight defense lowers the baseline probability by a pressure-specific amount.
  if (pressure === "Very Tight") {
    return 0.19;
  }

  if (pressure === "Tight") {
    return 0.11;
  }

  if (pressure === "Moderate") {
    return 0.06;
  }

  if (pressure === "Open") {
    return 0.025;
  }

  return 0;
}

function getSpacingAdjustment(
  zone: ShotZone,
  pressure: DefenderPressure,
  distance: number,
) {
  // Reward clean spacing and penalize contested non-paint looks.
  if (pressure === "Very Open") {
    if (zone === "Paint") {
      return 0.02;
    }

    if (zone === "Mid-Range") {
      return 0.035;
    }

    return zone === "Corner Three" ? 0.055 : 0.045;
  }

  if (pressure === "Open") {
    return isThreePointZone(zone) ? 0.02 : 0.015;
  }

  if (
    (pressure === "Very Tight" || pressure === "Tight") &&
    distance > 8 &&
    zone !== "Paint"
  ) {
    return -0.025;
  }

  return 0;
}

function getProbabilityFloor(zone: ShotZone) {
  // Floors prevent local estimates from falling to unrealistic zero values.
  return isThreePointZone(zone) ? 0.2 : 0.18;
}

function getProbabilityCeiling(zone: ShotZone) {
  // Ceilings prevent local estimates from becoming unrealistically high.
  return zone === "Paint" ? 0.82 : isThreePointZone(zone) ? 0.49 : 0.56;
}
