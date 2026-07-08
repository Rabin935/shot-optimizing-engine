import {
  BASKET_LOCATION,
  COURT_LENGTH_FT,
  COURT_WIDTH_FT,
  calculateDistance,
  clamp,
  clampPointToCourt,
  type CourtPoint,
} from "@/lib/sandbox-metrics";
import type { ActiveDefenderCount } from "@/store/useShotStore";

export type SimulatorShotContext = {
  shooterX: number;
  shotDistance: number;
  defenderX: number;
  defenderDistance: number;
  defenderCount: ActiveDefenderCount;
};

export type MappedCourtContext = {
  shooter: CourtPoint;
  defender: CourtPoint;
  defenderCount: ActiveDefenderCount;
};

/**
 * Convert the shared top-down court state into the controls used by the
 * side-view simulator. Distances are real straight-line court distances.
 */
export function courtStateToSimulatorContext(
  shooter: CourtPoint,
  defender: CourtPoint,
  defenderCount: ActiveDefenderCount,
): SimulatorShotContext {
  return {
    shooterX: roundCoordinate(shooter.x),
    shotDistance: roundCoordinate(calculateDistance(shooter, BASKET_LOCATION)),
    defenderX: roundCoordinate(defender.x),
    defenderDistance: roundCoordinate(calculateDistance(shooter, defender)),
    defenderCount,
  };
}

/**
 * Simple simulator -> sandbox mapping:
 * - simulator horizontal positions map directly to court x coordinates;
 * - shot distance places the shooter that many feet from the basket;
 * - defender distance places the defender that many feet toward the basket.
 *
 * The positive square-root keeps both players on the playable, in-front-of-rim
 * side of the half court. UI limits keep each requested distance representable.
 */
export function simulatorContextToCourt(
  context: SimulatorShotContext,
): MappedCourtContext {
  const shooterX = clamp(context.shooterX, 0, COURT_WIDTH_FT);
  const shooterHorizontalOffset = shooterX - BASKET_LOCATION.x;
  const safeShotDistance = Math.max(
    context.shotDistance,
    Math.abs(shooterHorizontalOffset),
  );
  const shooterVerticalOffset = getVerticalOffset(
    safeShotDistance,
    shooterHorizontalOffset,
  );
  const shooter = roundPoint(
    clampPointToCourt({
      x: shooterX,
      y: BASKET_LOCATION.y + shooterVerticalOffset,
    }),
  );

  const defenderX = clamp(context.defenderX, 0, COURT_WIDTH_FT);
  const defenderHorizontalOffset = defenderX - shooter.x;
  const safeDefenderDistance = Math.max(
    context.defenderDistance,
    Math.abs(defenderHorizontalOffset),
  );
  const defenderVerticalOffset = getVerticalOffset(
    safeDefenderDistance,
    defenderHorizontalOffset,
  );
  const defender = roundPoint(
    clampPointToCourt({
      x: defenderX,
      y: shooter.y - defenderVerticalOffset,
    }),
  );

  return {
    defender,
    defenderCount: context.defenderCount,
    shooter,
  };
}

export function getShotDistanceLimits(shooterX: number) {
  // The minimum reaches the selected x; the maximum reaches the far baseline.
  const horizontalOffset = Math.abs(shooterX - BASKET_LOCATION.x);
  const verticalRoom = COURT_LENGTH_FT - BASKET_LOCATION.y;

  return {
    max: Math.sqrt(horizontalOffset ** 2 + verticalRoom ** 2),
    min: Math.max(1, horizontalOffset),
  };
}

export function getDefenderDistanceLimits(
  shooter: CourtPoint,
  defenderX: number,
) {
  // Defender mapping moves toward the basket/baseline, so y=0 is the limit.
  const horizontalOffset = Math.abs(defenderX - shooter.x);

  return {
    max: Math.max(1, Math.sqrt(horizontalOffset ** 2 + shooter.y ** 2)),
    min: Math.max(0.5, horizontalOffset),
  };
}

export function simulatorContextsEqual(
  first: SimulatorShotContext,
  second: SimulatorShotContext,
) {
  // Slider values use tenths, so a small tolerance absorbs coordinate rounding.
  return (
    Math.abs(first.shooterX - second.shooterX) < 0.05 &&
    Math.abs(first.shotDistance - second.shotDistance) < 0.05 &&
    Math.abs(first.defenderX - second.defenderX) < 0.05 &&
    Math.abs(first.defenderDistance - second.defenderDistance) < 0.05 &&
    first.defenderCount === second.defenderCount
  );
}

function getVerticalOffset(distance: number, horizontalOffset: number) {
  return Math.sqrt(Math.max(0, distance ** 2 - horizontalOffset ** 2));
}

function roundPoint(point: CourtPoint): CourtPoint {
  return {
    x: roundCoordinate(point.x),
    y: roundCoordinate(point.y),
  };
}

function roundCoordinate(value: number) {
  return Math.round(value * 100) / 100;
}
