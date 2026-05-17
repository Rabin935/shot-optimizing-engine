export type CourtPoint = {
  x: number;
  y: number;
};

export type ShotZone = "Paint" | "Mid-Range" | "Three Point";
export type ShotType = "2PT" | "3PT";

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
