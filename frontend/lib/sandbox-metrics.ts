export type CourtPoint = {
  x: number;
  y: number;
};

export type ShotZone = "Paint" | "Mid-Range" | "Three Point";
export type ShotType = "2PT" | "3PT";
export type DefenderPressure = "Very Tight" | "Tight" | "Open" | "Very Open";
export type ShotQuality = "Excellent" | "Good" | "Average" | "Poor";

export type SandboxDefender = {
  id: string;
  label: string;
  point: CourtPoint;
  tone: "red" | "blue";
};

export type DefenderDistance = SandboxDefender & {
  distance: number;
};

export type SandboxStats = {
  distanceToBasket: number;
  shotZone: ShotZone;
  shotType: ShotType;
  shotValue: 2 | 3;
  makeProbability: number;
  expectedPoints: number;
  shotQuality: ShotQuality;
  defenderPressure: DefenderPressure;
  closestDefenderDistance: number;
  defenderDistances: DefenderDistance[];
};

export const COURT_WIDTH_FT = 50;
export const COURT_LENGTH_FT = 47;
export const BASKET_LOCATION: CourtPoint = { x: 25, y: 5.25 };

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function calculateDistance(a: CourtPoint, b: CourtPoint) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
}

export function getShotZone(point: CourtPoint): ShotZone {
  const distanceToBasket = calculateDistance(point, BASKET_LOCATION);
  const isCornerThree =
    (point.x <= 3 || point.x >= COURT_WIDTH_FT - 3) && point.y <= 14;
  const isAboveBreakThree = distanceToBasket >= 23.75 && point.y > 14;

  if (distanceToBasket <= 8) {
    return "Paint";
  }

  if (isCornerThree || isAboveBreakThree) {
    return "Three Point";
  }

  return "Mid-Range";
}

export function getShotType(point: CourtPoint): ShotType {
  return getShotZone(point) === "Three Point" ? "3PT" : "2PT";
}

export function getDefenderPressure(distance: number): DefenderPressure {
  if (distance <= 2) {
    return "Very Tight";
  }

  if (distance <= 4) {
    return "Tight";
  }

  if (distance <= 6) {
    return "Open";
  }

  return "Very Open";
}

export function getShotQuality(expectedPoints: number): ShotQuality {
  if (expectedPoints >= 1.25) {
    return "Excellent";
  }

  if (expectedPoints >= 1) {
    return "Good";
  }

  if (expectedPoints >= 0.82) {
    return "Average";
  }

  return "Poor";
}

export function calculateSandboxStats(
  shooter: CourtPoint,
  defenders: SandboxDefender[],
): SandboxStats {
  const distanceToBasket = calculateDistance(shooter, BASKET_LOCATION);
  const shotZone = getShotZone(shooter);
  const shotType = getShotType(shooter);
  const shotValue = shotType === "3PT" ? 3 : 2;
  const defenderDistances = defenders.map((defender) => ({
    ...defender,
    distance: calculateDistance(shooter, defender.point),
  }));
  const closestDefenderDistance = Math.min(
    ...defenderDistances.map((defender) => defender.distance),
  );
  const defenderPressure = getDefenderPressure(closestDefenderDistance);
  const baseProbability = getBaseProbability(shotZone, distanceToBasket);
  const pressurePenalty = getPressurePenalty(defenderPressure);
  const spacingBonus =
    shotType === "3PT" && defenderPressure === "Very Open" ? 0.035 : 0;
  const makeProbability = clamp(
    baseProbability - pressurePenalty + spacingBonus,
    0.18,
    0.78,
  );
  const expectedPoints = makeProbability * shotValue;

  return {
    closestDefenderDistance,
    defenderDistances,
    defenderPressure,
    distanceToBasket,
    expectedPoints,
    makeProbability,
    shotQuality: getShotQuality(expectedPoints),
    shotType,
    shotValue,
    shotZone,
  };
}

function getBaseProbability(zone: ShotZone, distance: number) {
  if (zone === "Paint") {
    return clamp(0.69 - Math.max(0, distance - 2) * 0.018, 0.5, 0.72);
  }

  if (zone === "Mid-Range") {
    return clamp(0.48 - Math.max(0, distance - 10) * 0.01, 0.34, 0.5);
  }

  return clamp(0.39 - Math.max(0, distance - 23.75) * 0.006, 0.29, 0.42);
}

function getPressurePenalty(pressure: DefenderPressure) {
  if (pressure === "Very Tight") {
    return 0.18;
  }

  if (pressure === "Tight") {
    return 0.1;
  }

  if (pressure === "Open") {
    return 0.04;
  }

  return 0;
}
