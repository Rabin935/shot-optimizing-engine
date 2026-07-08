import type { DefenderPoseState, ShooterPoseState } from "@/store/useShotStore";

export type ShootingAnimationStage =
  | "Ready Stance"
  | "Gather"
  | "Knee Load"
  | "Jump"
  | "Ball Release"
  | "Follow Through"
  | "Landing";

export type BallKeyframeState = {
  xOffset: number;
  yOffset: number;
  visible: boolean;
};

export type ShootingAnimationKeyframe = {
  id: string;
  label: ShootingAnimationStage;
  progress: number;
  shooterPose: ShooterPoseState;
  defenderPose: Partial<DefenderPoseState>;
  ball: BallKeyframeState;
};

const BASE_SHOOTER_POSE: ShooterPoseState = {
  guideHandAngle: 28,
  handHeight: 8.4,
  isAirborne: false,
  jumpHeight: 0,
  kneeBend: 24,
  leftLegAngle: 12,
  releaseAngle: 48,
  rightLegAngle: -12,
  shootingArmAngle: 52,
  torsoAngle: 0,
  verticalOffset: 0,
};

export const SHOOTING_ANIMATION_KEYFRAMES: ShootingAnimationKeyframe[] = [
  {
    id: "ready-stance",
    label: "Ready Stance",
    progress: 0,
    shooterPose: { ...BASE_SHOOTER_POSE, kneeBend: 22, shootingArmAngle: 34 },
    defenderPose: { armRaise: 34, kneeBend: 18, jumpHeight: 0, verticalOffset: 0 },
    ball: { visible: true, xOffset: 24, yOffset: -82 },
  },
  {
    id: "gather",
    label: "Gather",
    progress: 16,
    shooterPose: {
      ...BASE_SHOOTER_POSE,
      guideHandAngle: 18,
      handHeight: 7.2,
      kneeBend: 32,
      shootingArmAngle: 38,
      torsoAngle: 5,
    },
    defenderPose: { armRaise: 48, kneeBend: 21, leanAngle: -2 },
    ball: { visible: true, xOffset: 18, yOffset: -74 },
  },
  {
    id: "knee-load",
    label: "Knee Load",
    progress: 31,
    shooterPose: {
      ...BASE_SHOOTER_POSE,
      guideHandAngle: 22,
      handHeight: 7.7,
      kneeBend: 45,
      leftLegAngle: 18,
      rightLegAngle: -18,
      shootingArmAngle: 44,
      torsoAngle: 8,
    },
    defenderPose: { armRaise: 58, kneeBend: 26, leanAngle: -3 },
    ball: { visible: true, xOffset: 20, yOffset: -88 },
  },
  {
    id: "jump",
    label: "Jump",
    progress: 47,
    shooterPose: {
      ...BASE_SHOOTER_POSE,
      guideHandAngle: 27,
      handHeight: 8.8,
      isAirborne: true,
      jumpHeight: 6.2,
      kneeBend: 15,
      leftLegAngle: 7,
      rightLegAngle: -7,
      shootingArmAngle: 64,
      verticalOffset: 0.8,
    },
    defenderPose: {
      armRaise: 80,
      contestHeight: 9.6,
      isAirborne: true,
      jumpHeight: 4.2,
      kneeBend: 12,
      verticalOffset: 0.45,
    },
    ball: { visible: true, xOffset: 34, yOffset: -128 },
  },
  {
    id: "ball-release",
    label: "Ball Release",
    progress: 62,
    shooterPose: {
      ...BASE_SHOOTER_POSE,
      guideHandAngle: 31,
      handHeight: 9.8,
      isAirborne: true,
      jumpHeight: 9,
      kneeBend: 7,
      leftLegAngle: 4,
      releaseAngle: 51,
      rightLegAngle: -4,
      shootingArmAngle: 82,
      verticalOffset: 1.35,
    },
    defenderPose: {
      armRaise: 94,
      contestHeight: 10.7,
      isAirborne: true,
      jumpHeight: 7,
      kneeBend: 7,
      verticalOffset: 1,
    },
    ball: { visible: true, xOffset: 56, yOffset: -166 },
  },
  {
    id: "follow-through",
    label: "Follow Through",
    progress: 79,
    shooterPose: {
      ...BASE_SHOOTER_POSE,
      guideHandAngle: 38,
      handHeight: 10.2,
      isAirborne: true,
      jumpHeight: 5.3,
      kneeBend: 10,
      leftLegAngle: -2,
      releaseAngle: 52,
      rightLegAngle: 2,
      shootingArmAngle: 90,
      torsoAngle: -2,
      verticalOffset: 0.65,
    },
    defenderPose: {
      armRaise: 82,
      isAirborne: true,
      jumpHeight: 3.5,
      kneeBend: 13,
      verticalOffset: 0.38,
    },
    ball: { visible: false, xOffset: 84, yOffset: -178 },
  },
  {
    id: "landing",
    label: "Landing",
    progress: 100,
    shooterPose: {
      ...BASE_SHOOTER_POSE,
      guideHandAngle: 36,
      handHeight: 8.9,
      kneeBend: 26,
      leftLegAngle: 10,
      releaseAngle: 50,
      rightLegAngle: -10,
      shootingArmAngle: 86,
      torsoAngle: -1,
    },
    defenderPose: {
      armRaise: 62,
      isAirborne: false,
      jumpHeight: 0,
      kneeBend: 22,
      verticalOffset: 0,
    },
    ball: { visible: false, xOffset: 100, yOffset: -160 },
  },
];

export function getTimelineFrame(progress: number) {
  const normalized = clampProgress(progress);

  return SHOOTING_ANIMATION_KEYFRAMES.reduce((nearest, frame) =>
    Math.abs(frame.progress - normalized) < Math.abs(nearest.progress - normalized)
      ? frame
      : nearest,
  );
}

export function getTimelineFrameIndex(progress: number) {
  const frame = getTimelineFrame(progress);

  return SHOOTING_ANIMATION_KEYFRAMES.findIndex((item) => item.id === frame.id);
}

export function getTimelineBounds(progress: number) {
  const normalized = clampProgress(progress);
  const nextIndex = SHOOTING_ANIMATION_KEYFRAMES.findIndex(
    (frame) => frame.progress >= normalized,
  );

  if (nextIndex <= 0) {
    return {
      from: SHOOTING_ANIMATION_KEYFRAMES[0],
      localProgress: 0,
      to: SHOOTING_ANIMATION_KEYFRAMES[1],
    };
  }

  if (nextIndex === -1) {
    const last = SHOOTING_ANIMATION_KEYFRAMES.length - 1;

    return {
      from: SHOOTING_ANIMATION_KEYFRAMES[last - 1],
      localProgress: 1,
      to: SHOOTING_ANIMATION_KEYFRAMES[last],
    };
  }

  const from = SHOOTING_ANIMATION_KEYFRAMES[nextIndex - 1];
  const to = SHOOTING_ANIMATION_KEYFRAMES[nextIndex];
  const span = to.progress - from.progress || 1;

  return {
    from,
    localProgress: (normalized - from.progress) / span,
    to,
  };
}

export function interpolateShooterPose(progress: number): ShooterPoseState {
  const { from, localProgress, to } = getTimelineBounds(progress);

  return {
    guideHandAngle: lerp(from.shooterPose.guideHandAngle, to.shooterPose.guideHandAngle, localProgress),
    handHeight: lerp(from.shooterPose.handHeight, to.shooterPose.handHeight, localProgress),
    isAirborne: localProgress < 0.5 ? from.shooterPose.isAirborne : to.shooterPose.isAirborne,
    jumpHeight: lerp(from.shooterPose.jumpHeight, to.shooterPose.jumpHeight, localProgress),
    kneeBend: lerp(from.shooterPose.kneeBend, to.shooterPose.kneeBend, localProgress),
    leftLegAngle: lerp(from.shooterPose.leftLegAngle, to.shooterPose.leftLegAngle, localProgress),
    releaseAngle: lerp(from.shooterPose.releaseAngle, to.shooterPose.releaseAngle, localProgress),
    rightLegAngle: lerp(from.shooterPose.rightLegAngle, to.shooterPose.rightLegAngle, localProgress),
    shootingArmAngle: lerp(from.shooterPose.shootingArmAngle, to.shooterPose.shootingArmAngle, localProgress),
    torsoAngle: lerp(from.shooterPose.torsoAngle, to.shooterPose.torsoAngle, localProgress),
    verticalOffset: lerp(from.shooterPose.verticalOffset, to.shooterPose.verticalOffset, localProgress),
  };
}

export function interpolateDefenderPose(progress: number): Partial<DefenderPoseState> {
  const { from, localProgress, to } = getTimelineBounds(progress);

  return {
    armRaise: lerpNumber(from.defenderPose.armRaise, to.defenderPose.armRaise, localProgress),
    contestHeight: lerpNumber(from.defenderPose.contestHeight, to.defenderPose.contestHeight, localProgress),
    isAirborne: localProgress < 0.5 ? from.defenderPose.isAirborne : to.defenderPose.isAirborne,
    jumpHeight: lerpNumber(from.defenderPose.jumpHeight, to.defenderPose.jumpHeight, localProgress),
    kneeBend: lerpNumber(from.defenderPose.kneeBend, to.defenderPose.kneeBend, localProgress),
    leanAngle: lerpNumber(from.defenderPose.leanAngle, to.defenderPose.leanAngle, localProgress),
    verticalOffset: lerpNumber(from.defenderPose.verticalOffset, to.defenderPose.verticalOffset, localProgress),
  };
}

export function nextFrameProgress(progress: number) {
  const index = getTimelineFrameIndex(progress);
  const nextIndex = Math.min(index + 1, SHOOTING_ANIMATION_KEYFRAMES.length - 1);

  return SHOOTING_ANIMATION_KEYFRAMES[nextIndex].progress;
}

export function previousFrameProgress(progress: number) {
  const index = getTimelineFrameIndex(progress);
  const previousIndex = Math.max(index - 1, 0);

  return SHOOTING_ANIMATION_KEYFRAMES[previousIndex].progress;
}

function lerpNumber(
  from: number | undefined,
  to: number | undefined,
  progress: number,
) {
  return lerp(from ?? 0, to ?? from ?? 0, progress);
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function clampProgress(progress: number) {
  return Math.min(Math.max(progress, 0), 100);
}
