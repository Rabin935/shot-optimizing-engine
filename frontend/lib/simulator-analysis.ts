import type {
  DefenderPoseState,
  SharedPressureLevel,
  ShooterPoseState,
  ShotMetricsState,
} from "@/store/useShotStore";

export type MechanicsScore = {
  balance: number;
  contestHandling: number;
  footwork: number;
  jumpTiming: number;
  overallForm: number;
  release: number;
};

export type CoachingFeedbackItem = {
  id: string;
  message: string;
  tone: "green" | "orange" | "red";
};

export function calculateMechanicsScore({
  defenderPose,
  pressureLevel,
  shooterPose,
}: {
  defenderPose: DefenderPoseState;
  pressureLevel: SharedPressureLevel;
  shooterPose: ShooterPoseState;
}): MechanicsScore {
  const balance = weightedAverage([
    [scoreIdeal(Math.abs(shooterPose.torsoAngle), 0, 12), 0.45],
    [scoreIdeal(Math.abs(shooterPose.leftLegAngle + shooterPose.rightLegAngle), 0, 18), 0.25],
    [scoreIdeal(shooterPose.kneeBend, 20, 24), 0.3],
  ]);
  const release = weightedAverage([
    [scoreRange(shooterPose.releaseAngle, 47, 54, 16), 0.4],
    [scoreRange(shooterPose.handHeight, 8.8, 10.8, 1.8), 0.32],
    [scoreRange(shooterPose.shootingArmAngle, 72, 90, 18), 0.28],
  ]);
  const jumpTiming = weightedAverage([
    [scoreRange(shooterPose.jumpHeight, 5.5, 9.5, 4), 0.45],
    [scoreRange(shooterPose.verticalOffset, 0.7, 1.35, 0.7), 0.35],
    [shooterPose.isAirborne ? 1 : 0.55, 0.2],
  ]);
  const footwork = weightedAverage([
    [scoreIdeal(Math.abs(shooterPose.leftLegAngle), 8, 22), 0.35],
    [scoreIdeal(Math.abs(shooterPose.rightLegAngle), 8, 22), 0.35],
    [scoreRange(shooterPose.kneeBend, 14, 34, 16), 0.3],
  ]);
  const contestHandling = weightedAverage([
    [1 - contestStrength(defenderPose), 0.45],
    [scoreRange(shooterPose.releaseAngle, 50, 58, 14), 0.28],
    [scoreRange(shooterPose.handHeight, 9.2, 11.2, 1.7), 0.27],
  ]);
  const pressurePenalty = pressureLevel.includes("Tight") ? 5 : 0;
  const overallForm =
    balance * 0.2 +
    release * 0.24 +
    jumpTiming * 0.18 +
    footwork * 0.18 +
    contestHandling * 0.2 -
    pressurePenalty;

  return {
    balance: toScore(balance),
    contestHandling: toScore(contestHandling),
    footwork: toScore(footwork),
    jumpTiming: toScore(jumpTiming),
    overallForm: clampScore(overallForm),
    release: toScore(release),
  };
}

export function generateCoachingFeedback({
  defenderPose,
  metrics,
  shooterPose,
}: {
  defenderPose: DefenderPoseState;
  metrics: Pick<
    ShotMetricsState,
    "closestDefenderDistance" | "epps" | "makeProbability" | "pressureLevel"
  >;
  shooterPose: ShooterPoseState;
}): CoachingFeedbackItem[] {
  const feedback: CoachingFeedbackItem[] = [];

  if (shooterPose.releaseAngle < 47) {
    feedback.push({
      id: "release-angle-low",
      message: "Your release angle is slightly low.",
      tone: "orange",
    });
  } else if (shooterPose.releaseAngle > 60) {
    feedback.push({
      id: "release-angle-high",
      message: "Your release angle is high; keep the arc soft without floating the shot.",
      tone: "orange",
    });
  } else {
    feedback.push({
      id: "release-angle-good",
      message: "Release angle is in a strong window.",
      tone: "green",
    });
  }

  if (shooterPose.kneeBend < 16) {
    feedback.push({
      id: "knee-flexion",
      message: "Increase knee flexion before takeoff.",
      tone: "orange",
    });
  }

  if (shooterPose.handHeight < 8.7) {
    feedback.push({
      id: "release-point",
      message: "Raise release point to shoot above the contest.",
      tone: "orange",
    });
  }

  if (defenderPose.armRaise < 64 || defenderPose.contestHeight < 8.5) {
    feedback.push({
      id: "late-contest",
      message: "Defender contest is late.",
      tone: "green",
    });
  } else if (defenderPose.armRaise > 88) {
    feedback.push({
      id: "high-contest",
      message: "Defender contest is strong; speed up the gather or create space.",
      tone: "red",
    });
  }

  if (metrics.closestDefenderDistance >= 5 || metrics.pressureLevel.includes("Open")) {
    feedback.push({
      id: "spacing",
      message: "Maintain current spacing.",
      tone: "green",
    });
  }

  if (metrics.epps < 0.9 && metrics.makeProbability > 0) {
    feedback.push({
      id: "epps",
      message: "Shot value is low; use the optimizer recommendation before forcing this look.",
      tone: "orange",
    });
  }

  return feedback.slice(0, 5);
}

export function getRecommendedShooterPose(
  currentPose: ShooterPoseState,
): ShooterPoseState {
  // Recommended pose nudges the current body toward a balanced jumper instead
  // of replacing the user with an unrelated perfect template.
  return {
    ...currentPose,
    guideHandAngle: blend(currentPose.guideHandAngle, 30, 0.65),
    handHeight: blend(currentPose.handHeight, 9.6, 0.65),
    isAirborne: true,
    jumpHeight: blend(currentPose.jumpHeight, 7.6, 0.65),
    kneeBend: blend(currentPose.kneeBend, 22, 0.65),
    leftLegAngle: blend(currentPose.leftLegAngle, 8, 0.65),
    releaseAngle: blend(currentPose.releaseAngle, 52, 0.65),
    rightLegAngle: blend(currentPose.rightLegAngle, -8, 0.65),
    shootingArmAngle: blend(currentPose.shootingArmAngle, 82, 0.65),
    torsoAngle: blend(currentPose.torsoAngle, 1, 0.65),
    verticalOffset: blend(currentPose.verticalOffset, 1.05, 0.65),
  };
}

export function comparePoses({
  currentEpps,
  currentPose,
  defenderPose,
  recommendedEpps,
  recommendedPose,
}: {
  currentEpps: number;
  currentPose: ShooterPoseState;
  defenderPose: DefenderPoseState;
  recommendedEpps: number;
  recommendedPose: ShooterPoseState;
}) {
  return {
    contestDifference: Math.round(contestStrength(defenderPose) * -18),
    eppsDifference: recommendedEpps - currentEpps,
    jumpDifference: recommendedPose.jumpHeight - currentPose.jumpHeight,
    releaseDifference: recommendedPose.releaseAngle - currentPose.releaseAngle,
  };
}

function contestStrength(defenderPose: DefenderPoseState) {
  return Math.min(
    1,
    defenderPose.armRaise / 115 +
      Math.max(0, defenderPose.contestHeight - 7) / 10 +
      (defenderPose.isAirborne ? 0.12 : 0),
  );
}

function scoreRange(
  value: number,
  idealMin: number,
  idealMax: number,
  falloff: number,
) {
  if (value >= idealMin && value <= idealMax) {
    return 1;
  }

  const distance = value < idealMin ? idealMin - value : value - idealMax;

  return Math.max(0, 1 - distance / falloff);
}

function scoreIdeal(value: number, ideal: number, falloff: number) {
  return Math.max(0, 1 - Math.abs(value - ideal) / falloff);
}

function weightedAverage(values: Array<[number, number]>) {
  return values.reduce((sum, [value, weight]) => sum + value * weight, 0);
}

function toScore(value: number) {
  return clampScore(value * 100);
}

function clampScore(value: number) {
  return Math.round(Math.min(Math.max(value, 0), 100));
}

function blend(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}
