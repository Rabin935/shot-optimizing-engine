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
  hasContact: boolean;
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
  scoreRim = rim,
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
  scoreRim?: StagePoint;
  shotDistance: number;
}): BallVisualState {
  const flightProgress = Math.min(Math.max((progress - 57) / 43, 0), 1);
  const blockFlightProgress = Math.min(Math.max(blockProgress ?? 0.5, 0.08), 0.94);

  if (outcome === "block" && blockPoint) {
    const contactProgress = Math.min(flightProgress, blockFlightProgress);
    const control = getArcControlPoint({
      releaseAngle,
      releasePoint,
      rim: blockPoint,
      shotDistance,
    });
    const contactPoint = getBezierPoint(
      releasePoint,
      control,
      blockPoint,
      contactProgress / blockFlightProgress,
    );
    const deflectionProgress = Math.min(
      Math.max((flightProgress - blockFlightProgress) / (1 - blockFlightProgress), 0),
      1,
    );
    const ball =
      flightProgress >= blockFlightProgress
        ? {
            x: blockPoint.x - 88 * deflectionProgress,
            y:
              blockPoint.y +
              34 * deflectionProgress +
              84 * deflectionProgress * deflectionProgress,
          }
        : contactPoint;

    return {
      ball,
      backboardFlash: false,
      hasContact: flightProgress >= blockFlightProgress,
      impactOffset: {
        x: ball.x - contactPoint.x,
        y: ball.y - contactPoint.y,
      },
      label: getOutcomeLabel(outcome),
      rimPulse: false,
      swish: false,
    };
  }

  if (outcome === "backboard") {
    return getBackboardBankVisualState({
      contactPoint: rim,
      flightProgress,
      releaseAngle,
      releasePoint,
      scoreRim,
      shotDistance,
    });
  }

  const target = getOutcomeTarget(outcome, rim);
  const control = getArcControlPoint({
    releaseAngle,
    releasePoint,
    rim: target,
    shotDistance,
  });
  const baseBall = getBezierPoint(releasePoint, control, target, flightProgress);
  const impactOffset = getImpactOffset(outcome, flightProgress);
  const ball = {
    x: baseBall.x + impactOffset.x,
    y: baseBall.y + impactOffset.y,
  };
  const hasContact = flightProgress > getContactProgress(outcome);

  return {
    ball,
    backboardFlash: false,
    hasContact,
    impactOffset,
    label: getOutcomeLabel(outcome),
    rimPulse:
      (outcome === "rim-bounce" || outcome === "make") && hasContact,
    swish: outcome === "swish" && hasContact,
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
  const angleLift = (releaseAngle - 20) * 2.85;

  return {
    x: (releasePoint.x + rim.x) / 2,
    y: Math.min(releasePoint.y, rim.y) - 58 - distanceLift - angleLift,
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
    return rim;
  }

  if (outcome === "miss") {
    return rim;
  }

  if (outcome === "rim-bounce") {
    return rim;
  }

  return { x: rim.x, y: rim.y };
}

function getImpactOffset(outcome: ShotOutcomeKind, progress: number): StagePoint {
  const contactProgress = getContactProgress(outcome);

  if (progress < contactProgress) {
    return { x: 0, y: 0 };
  }

  const impact = Math.min(
    Math.max((progress - contactProgress) / (1 - contactProgress), 0),
    1,
  );

  if (outcome === "rim-bounce") {
    return {
      x: -72 * impact,
      y: -Math.sin(impact * Math.PI) * 44 + impact * 88,
    };
  }

  if (outcome === "backboard") {
    return { x: -impact * 24, y: impact * 36 };
  }

  if (outcome === "miss") {
    return { x: impact * 38, y: impact * 92 };
  }

  if (outcome === "make") {
    return { x: Math.sin(impact * Math.PI * 2) * 5, y: impact * 58 };
  }

  if (outcome === "block") {
    return { x: -impact * 34, y: impact * 30 };
  }

  return { x: 0, y: impact * 46 };
}

function getBackboardBankVisualState({
  contactPoint,
  flightProgress,
  releaseAngle,
  releasePoint,
  scoreRim,
  shotDistance,
}: {
  contactPoint: StagePoint;
  flightProgress: number;
  releaseAngle: number;
  releasePoint: StagePoint;
  scoreRim: StagePoint;
  shotDistance: number;
}): BallVisualState {
  const contactProgress = getContactProgress("backboard");
  const flightControl = getArcControlPoint({
    releaseAngle,
    releasePoint,
    rim: contactPoint,
    shotDistance,
  });
  const contactBall = getBezierPoint(
    releasePoint,
    flightControl,
    contactPoint,
    Math.min(flightProgress / contactProgress, 1),
  );

  if (flightProgress < contactProgress) {
    return {
      ball: contactBall,
      backboardFlash: false,
      hasContact: false,
      impactOffset: { x: 0, y: 0 },
      label: getOutcomeLabel("backboard"),
      rimPulse: false,
      swish: false,
    };
  }

  const postContact = Math.min(
    Math.max((flightProgress - contactProgress) / (1 - contactProgress), 0),
    1,
  );
  const rimEntry = { x: scoreRim.x + 1, y: scoreRim.y + 2 };
  const bankProgress = Math.min(postContact / 0.56, 1);
  const bankControl = {
    x: (contactPoint.x + rimEntry.x) / 2 + 8,
    y: Math.min(contactPoint.y, rimEntry.y) - 36,
  };
  const bankBall = getBezierPoint(
    contactPoint,
    bankControl,
    rimEntry,
    bankProgress,
  );
  const netProgress = Math.min(Math.max((postContact - 0.56) / 0.44, 0), 1);
  const ball =
    postContact <= 0.56
      ? bankBall
      : {
          x: rimEntry.x + Math.sin(netProgress * Math.PI * 2) * 4,
          y: rimEntry.y + netProgress * 64,
        };

  return {
    ball,
    backboardFlash: true,
    hasContact: true,
    impactOffset: {
      x: ball.x - contactPoint.x,
      y: ball.y - contactPoint.y,
    },
    label: getOutcomeLabel("backboard"),
    rimPulse: postContact > 0.45,
    swish: postContact > 0.56,
  };
}

function getContactProgress(outcome: ShotOutcomeKind) {
  if (outcome === "swish") {
    return 0.9;
  }

  if (outcome === "miss") {
    return 0.76;
  }

  return 0.82;
}

function getOutcomeLabel(outcome: ShotOutcomeKind) {
  if (outcome === "block") {
    return "Blocked";
  }

  if (outcome === "swish") {
    return "Score";
  }

  if (outcome === "make") {
    return "Score";
  }

  if (outcome === "rim-bounce") {
    return "Rim bounce";
  }

  if (outcome === "backboard") {
    return "Bank score";
  }

  return "Miss";
}
