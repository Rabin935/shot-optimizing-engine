import type { SharedShotQuality, ShooterPoseState } from "@/store/useShotStore";

export type StagePoint = {
  x: number;
  y: number;
};

export type ShotOutcomeKind =
  | "backboard"
  | "block"
  | "make"
  | "miss"
  | "rim-bounce"
  | "swish";

export type BallVisualState = {
  ball: StagePoint;
  backboardFlash: boolean;
  impactOffset: StagePoint;
  label: string;
  rimPulse: boolean;
  swish: boolean;
};

export function getReleasePoint({
  shooterPose,
  shooterStage,
}: {
  shooterPose: ShooterPoseState;
  shooterStage: StagePoint;
}): StagePoint {
  const lift = Math.max(
    0,
    shooterPose.verticalOffset * 22 +
      (shooterPose.isAirborne
        ? shooterPose.jumpHeight * 4 + 12
        : shooterPose.jumpHeight * 2),
  );
  const hipHeight = Math.max(58, 92 - shooterPose.kneeBend * 0.42);
  const hip = { x: shooterStage.x, y: shooterStage.y - hipHeight };
  const shoulder = polarPoint(hip, -90 + shooterPose.torsoAngle, 72);
  const handHeightBoost = (shooterPose.handHeight - 8.4) * 5;
  const releaseBoost = (shooterPose.releaseAngle - 48) * 0.28;
  const primaryElbow = polarPoint(
    shoulder,
    -82 + shooterPose.shootingArmAngle * 0.32 - releaseBoost * 0.35,
    42,
  );
  const primaryHandBase = polarPoint(
    primaryElbow,
    -96 + shooterPose.shootingArmAngle * 0.24 - releaseBoost,
    43,
  );

  return {
    x: primaryHandBase.x,
    y: primaryHandBase.y - lift - handHeightBoost,
  };
}

export function buildShotPath({
  releaseAngle,
  releasePoint,
  rim,
  shotDistance,
}: {
  releaseAngle: number;
  releasePoint: StagePoint;
  rim: StagePoint;
  shotDistance: number;
}) {
  const control = getArcControlPoint({
    releaseAngle,
    releasePoint,
    rim,
    shotDistance,
  });

  return `M ${releasePoint.x} ${releasePoint.y} Q ${control.x} ${control.y} ${rim.x} ${rim.y}`;
}

export function getShotPathTarget(outcome: ShotOutcomeKind, rim: StagePoint) {
  return getOutcomeTarget(outcome, rim);
}

export function getBallVisualState({
  outcome,
  progress,
  releaseAngle,
  releasePoint,
  rim,
  shotDistance,
  blockPoint,
  blockProgress,
}: {
  blockPoint?: StagePoint | null;
  blockProgress?: number;
  outcome: ShotOutcomeKind;
  progress: number;
  releaseAngle: number;
  releasePoint: StagePoint;
  rim: StagePoint;
  shotDistance: number;
}): BallVisualState {
  const flightProgress = Math.min(Math.max((progress - 57) / 43, 0), 1);
  const blockFlightProgress = Math.max(blockProgress ?? 0.5, 0.08);
  const target = outcome === "block" ? rim : getOutcomeTarget(outcome, rim);
  const pathProgress =
    outcome === "block"
      ? Math.min(flightProgress, blockFlightProgress)
      : flightProgress;
  const control = getArcControlPoint({
    releaseAngle,
    releasePoint,
    rim: target,
    shotDistance,
  });
  const baseBall =
    outcome === "block" && blockPoint && flightProgress >= blockFlightProgress
      ? blockPoint
      : getBezierPoint(releasePoint, control, target, pathProgress);
  const blockImpactProgress =
    outcome === "block"
      ? Math.min(
          Math.max((flightProgress - blockFlightProgress) / (1 - blockFlightProgress), 0),
          1,
        )
      : pathProgress;
  const impactOffset = getImpactOffset(
    outcome,
    outcome === "block" ? 0.82 + blockImpactProgress * 0.18 : pathProgress,
  );
  const ball = {
    x: baseBall.x + impactOffset.x,
    y: baseBall.y + impactOffset.y,
  };

  return {
    ball,
    backboardFlash: outcome === "backboard" && flightProgress > 0.78,
    impactOffset,
    label: getOutcomeLabel(outcome),
    rimPulse:
      (outcome === "rim-bounce" || outcome === "make") && flightProgress > 0.82,
    swish: outcome === "swish" && flightProgress > 0.86,
  };
}

export function selectShotOutcome({
  makeProbability,
  releaseAngle,
  shotQuality,
}: {
  makeProbability: number;
  releaseAngle: number;
  shotQuality: SharedShotQuality;
}): ShotOutcomeKind {
  if (makeProbability >= 0.62 || shotQuality === "Excellent") {
    return "swish";
  }

  if (makeProbability >= 0.49 || shotQuality === "Good") {
    return "make";
  }

  if (releaseAngle > 58) {
    return "backboard";
  }

  if (releaseAngle < 44 || shotQuality === "Poor") {
    return "rim-bounce";
  }

  return "miss";
}

export function getFlightDuration(shotDistance: number) {
  // This value only drives animation pacing; it is intentionally not physics.
  return Math.round(850 + Math.min(Math.max(shotDistance, 2), 32) * 34);
}

export function getArcControlPoint({
  releaseAngle,
  releasePoint,
  rim,
  shotDistance,
}: {
  releaseAngle: number;
  releasePoint: StagePoint;
  rim: StagePoint;
  shotDistance: number;
}) {
  const distanceLift = Math.min(Math.max(shotDistance, 8), 32) * 3.8;
  const angleLift = (releaseAngle - 20) * 2.1;

  return {
    x: (releasePoint.x + rim.x) / 2,
    y: Math.min(releasePoint.y, rim.y) - 48 - distanceLift - angleLift,
  };
}

export function getBezierPoint(
  start: StagePoint,
  control: StagePoint,
  end: StagePoint,
  progress: number,
) {
  const inverse = 1 - progress;

  return {
    x: inverse * inverse * start.x + 2 * inverse * progress * control.x + progress * progress * end.x,
    y: inverse * inverse * start.y + 2 * inverse * progress * control.y + progress * progress * end.y,
  };
}

function polarPoint(origin: StagePoint, angleDegrees: number, length: number) {
  const angle = (angleDegrees * Math.PI) / 180;

  return {
    x: origin.x + Math.cos(angle) * length,
    y: origin.y + Math.sin(angle) * length,
  };
}

function getOutcomeTarget(outcome: ShotOutcomeKind, rim: StagePoint) {
  if (outcome === "block") {
    return rim;
  }

  if (outcome === "backboard") {
    return { x: rim.x + 38, y: rim.y - 48 };
  }

  if (outcome === "miss") {
    return { x: rim.x + 52, y: rim.y + 46 };
  }

  if (outcome === "rim-bounce") {
    return { x: rim.x + 22, y: rim.y - 5 };
  }

  return { x: rim.x, y: rim.y + 4 };
}

function getImpactOffset(outcome: ShotOutcomeKind, progress: number): StagePoint {
  if (progress < 0.82) {
    return { x: 0, y: 0 };
  }

  const impact = (progress - 0.82) / 0.18;

  if (outcome === "rim-bounce") {
    return { x: Math.sin(impact * Math.PI * 3) * 18, y: -Math.sin(impact * Math.PI) * 24 };
  }

  if (outcome === "backboard") {
    return { x: -impact * 42, y: impact * 58 };
  }

  if (outcome === "miss") {
    return { x: impact * 46, y: impact * 34 };
  }

  if (outcome === "make") {
    return { x: Math.sin(impact * Math.PI * 2) * 8, y: impact * 38 };
  }

  if (outcome === "block") {
    return { x: -impact * 34, y: impact * 30 };
  }

  return { x: 0, y: impact * 46 };
}

function getOutcomeLabel(outcome: ShotOutcomeKind) {
  if (outcome === "block") {
    return "Block";
  }

  if (outcome === "swish") {
    return "Swish";
  }

  if (outcome === "make") {
    return "Make";
  }

  if (outcome === "rim-bounce") {
    return "Rim bounce";
  }

  if (outcome === "backboard") {
    return "Backboard hit";
  }

  return "Miss";
}
