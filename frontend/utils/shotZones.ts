import {
  BASKET_LOCATION,
  COURT_WIDTH_FT,
  calculateDistance,
  type CourtPoint,
} from "@/utils/courtMath";

export type ShotZone =
  | "Paint"
  | "Mid-Range"
  | "Corner Three"
  | "Wing Three"
  | "Top Three";

export type ShotType = "2PT" | "3PT";

export type SnapTarget = {
  id: string;
  label: string;
  point: CourtPoint;
  radius: number;
  zone: ShotZone;
};

const CORNER_THREE_WIDTH_FT = 3.2;
const CORNER_THREE_DEPTH_FT = 14;
const NBA_THREE_DISTANCE_FT = 23.75;

// Preset snap targets make the shooter easier to place on common shot spots.
export const SNAP_TARGETS: SnapTarget[] = [
  {
    id: "paint-touch",
    label: "Paint Touch",
    point: { x: 25, y: 8 },
    radius: 1.25,
    zone: "Paint",
  },
  {
    id: "left-corner-three",
    label: "Left Corner 3",
    point: { x: 3, y: 11 },
    radius: 1.35,
    zone: "Corner Three",
  },
  {
    id: "right-corner-three",
    label: "Right Corner 3",
    point: { x: 47, y: 11 },
    radius: 1.35,
    zone: "Corner Three",
  },
  {
    id: "left-wing-three",
    label: "Left Wing 3",
    point: { x: 7, y: 24 },
    radius: 1.45,
    zone: "Wing Three",
  },
  {
    id: "right-wing-three",
    label: "Right Wing 3",
    point: { x: 43, y: 24 },
    radius: 1.45,
    zone: "Wing Three",
  },
  {
    id: "top-of-key",
    label: "Top of Key",
    point: { x: 25, y: 29 },
    radius: 1.45,
    zone: "Top Three",
  },
];

export function isCornerThree(point: CourtPoint) {
  // Corner threes are near the sideline and below the break.
  return (
    (point.x <= CORNER_THREE_WIDTH_FT ||
      point.x >= COURT_WIDTH_FT - CORNER_THREE_WIDTH_FT) &&
    point.y <= CORNER_THREE_DEPTH_FT
  );
}

export function isAboveBreakThree(point: CourtPoint) {
  // Above-the-break threes are determined by distance from the basket.
  return calculateDistance(point, BASKET_LOCATION) >= NBA_THREE_DISTANCE_FT;
}

export function getShotZone(point: CourtPoint): ShotZone {
  // Classify a court point into the zone shown in the sandbox and API payload.
  const distanceToBasket = calculateDistance(point, BASKET_LOCATION);

  if (distanceToBasket <= 8) {
    return "Paint";
  }

  if (isCornerThree(point)) {
    return "Corner Three";
  }

  if (isAboveBreakThree(point)) {
    const isTop = point.x >= 17 && point.x <= 33;

    return isTop ? "Top Three" : "Wing Three";
  }

  return "Mid-Range";
}

export function isThreePointZone(zone: ShotZone) {
  // Group the three separate frontend 3PT zones into one shot-value category.
  return zone === "Corner Three" || zone === "Wing Three" || zone === "Top Three";
}

export function getShotType(point: CourtPoint): ShotType {
  // Return display-friendly 2PT or 3PT text for a court point.
  return isThreePointZone(getShotZone(point)) ? "3PT" : "2PT";
}

export function getShotValue(zone: ShotZone): 2 | 3 {
  // Convert a zone label into the point value needed for EPPS.
  return isThreePointZone(zone) ? 3 : 2;
}

export function getNearestSnapTarget(point: CourtPoint) {
  // Find the closest predefined spot for snap-assist behavior.
  return SNAP_TARGETS.reduce<{
    distance: number;
    target: SnapTarget | null;
  }>(
    (closest, target) => {
      const distance = calculateDistance(point, target.point);

      if (distance < closest.distance) {
        return { distance, target };
      }

      return closest;
    },
    { distance: Number.POSITIVE_INFINITY, target: null },
  );
}

export function applySnapAssist(point: CourtPoint) {
  // Snap to a nearby target only when the point is inside that target's radius.
  const nearest = getNearestSnapTarget(point);

  if (nearest.target && nearest.distance <= nearest.target.radius) {
    return nearest.target.point;
  }

  return point;
}
