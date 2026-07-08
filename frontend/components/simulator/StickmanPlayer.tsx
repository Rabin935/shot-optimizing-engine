"use client";

import { motion } from "framer-motion";
import type { PointerEvent } from "react";
import { useState } from "react";

type PlayerType = "shooter" | "defender";

export type StickmanPoint = {
  x: number;
  y: number;
};

export type StickmanPoseHandle =
  | "head"
  | "hip"
  | "leftFoot"
  | "leftKnee"
  | "primaryElbow"
  | "primaryHand"
  | "rightFoot"
  | "rightKnee"
  | "secondaryElbow"
  | "secondaryHand"
  | "shoulder";

export type StickmanPoseDrag = {
  delta: StickmanPoint;
  handle: StickmanPoseHandle;
  point: StickmanPoint;
  type: PlayerType;
};

type StickmanGeometry = {
  arms: {
    primaryElbow: StickmanPoint;
    primaryHand: StickmanPoint;
    secondaryElbow: StickmanPoint;
    secondaryHand: StickmanPoint;
  };
  head: StickmanPoint;
  hip: StickmanPoint;
  leftFoot: StickmanPoint;
  leftKnee: StickmanPoint;
  lift: number;
  rightFoot: StickmanPoint;
  rightKnee: StickmanPoint;
  shadowOpacity: number;
  shadowWidth: number;
  shoulder: StickmanPoint;
};

export type StickmanHitGeometry = {
  circles: { point: StickmanPoint; radius: number }[];
  segments: { from: StickmanPoint; radius: number; to: StickmanPoint }[];
};

export type StickmanPlayerProps = {
  type: PlayerType;
  x: number;
  y: number;
  verticalOffset: number;
  torsoAngle: number;
  kneeBend: number;
  leftLegAngle?: number;
  rightLegAngle?: number;
  shootingArmAngle?: number;
  guideHandAngle?: number;
  handHeight?: number;
  releaseAngle?: number;
  isAnimating?: boolean;
  armRaise?: number;
  contestHeight?: number;
  isAirborne: boolean;
  jumpHeight?: number;
  color?: string;
  glowFilter?: string;
  label?: string;
  onPosePointDrag?: (drag: StickmanPoseDrag) => void;
  showActionMarker?: boolean;
};

const PLAYER_COLORS: Record<PlayerType, string> = {
  defender: "#4ade80",
  shooter: "#fb923c",
};

const PLAYER_LABELS: Record<PlayerType, string> = {
  defender: "Defender",
  shooter: "Shooter",
};

export function StickmanPlayer({
  armRaise = 0,
  color,
  contestHeight = 0,
  glowFilter,
  guideHandAngle = 24,
  handHeight = 8.4,
  isAnimating = false,
  isAirborne,
  jumpHeight = 0,
  kneeBend,
  label,
  leftLegAngle = 0,
  onPosePointDrag,
  rightLegAngle = 0,
  releaseAngle = 48,
  showActionMarker = true,
  shootingArmAngle = 52,
  torsoAngle,
  type,
  verticalOffset,
  x,
  y,
}: StickmanPlayerProps) {
  const accentColor = color ?? PLAYER_COLORS[type];
  const displayLabel = label ?? PLAYER_LABELS[type];
  const isShooter = type === "shooter";
  const bodyStroke = isShooter ? "#f8fafc" : "#d1fae5";
  const geometry = getStickmanGeometry({
    armRaise,
    contestHeight,
    guideHandAngle,
    handHeight,
    isAirborne,
    jumpHeight,
    kneeBend,
    leftLegAngle,
    releaseAngle,
    rightLegAngle,
    shootingArmAngle,
    torsoAngle,
    type,
    verticalOffset,
    x,
    y,
  });
  const {
    arms,
    head,
    hip,
    leftFoot,
    leftKnee,
    lift,
    rightFoot,
    rightKnee,
    shadowOpacity,
    shadowWidth,
    shoulder,
  } = geometry;
  const [dragState, setDragState] = useState<{
    lastPoint: StickmanPoint;
    pointerId: number;
  } | null>(null);
  const beginPoseDrag = (
    handle: StickmanPoseHandle,
    event: PointerEvent<SVGElement>,
  ) => {
    if (!onPosePointDrag) {
      return;
    }

    const point = getPointerStagePoint(event);

    if (!point) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({ lastPoint: point, pointerId: event.pointerId });
  };
  const continuePoseDrag = (
    handle: StickmanPoseHandle,
    event: PointerEvent<SVGElement>,
  ) => {
    if (!onPosePointDrag || !dragState) {
      return;
    }

    const point = getPointerStagePoint(event);

    if (!point) {
      return;
    }

    const delta = {
      x: point.x - dragState.lastPoint.x,
      y: point.y - dragState.lastPoint.y,
    };

    setDragState({ ...dragState, lastPoint: point });
    onPosePointDrag({ delta, handle, point, type });
  };
  const endPoseDrag = (event: PointerEvent<SVGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragState(null);
  };
  const getHandleProps = (handle: StickmanPoseHandle) =>
    onPosePointDrag
      ? {
          onPointerCancel: endPoseDrag,
          onPointerDown: (event: PointerEvent<SVGElement>) =>
            beginPoseDrag(handle, event),
          onPointerMove: (event: PointerEvent<SVGElement>) =>
            continuePoseDrag(handle, event),
          onPointerUp: endPoseDrag,
        }
      : undefined;

  return (
    <g filter={glowFilter}>
      <motion.ellipse
        cx={x}
        cy={y + 7}
        rx={shadowWidth / 2}
        ry="11"
        fill="rgba(0,0,0,0.58)"
        initial={false}
        animate={{ opacity: shadowOpacity, rx: shadowWidth / 2 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />

      <motion.g
        initial={false}
        animate={{ y: -lift }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        <path
          d={`M ${hip.x} ${hip.y}L${shoulder.x} ${shoulder.y}`}
          stroke={bodyStroke}
          strokeLinecap="round"
          strokeWidth="10"
        />
        {isShooter ? (
          <path
            d={`M ${hip.x - 14} ${hip.y - 18}L${hip.x + 18} ${hip.y - 22}`}
            stroke={accentColor}
            strokeLinecap="round"
            strokeWidth="7"
          />
        ) : (
          <rect
            x={hip.x - 15}
            y={hip.y - 38}
            width="30"
            height="24"
            rx="6"
            fill="rgba(74,222,128,0.16)"
            stroke={accentColor}
            strokeWidth="3"
          />
        )}

        <LimbPath
          points={[hip, leftKnee, leftFoot]}
          stroke={bodyStroke}
          width={10}
        />
        <LimbPath
          points={[hip, rightKnee, rightFoot]}
          stroke={bodyStroke}
          width={10}
        />
        <LimbPath
          points={[shoulder, arms.primaryElbow, arms.primaryHand]}
          stroke={accentColor}
          width={10}
        />
        <LimbPath
          points={[shoulder, arms.secondaryElbow, arms.secondaryHand]}
          stroke={isShooter ? "#e5e7eb" : "#bbf7d0"}
          width={8}
        />

        <circle
          cx={head.x}
          cy={head.y}
          r="23"
          fill="rgba(15,23,42,0.92)"
          stroke={accentColor}
          strokeWidth="5"
        />

        <Joint
          accentColor={accentColor}
          point={hip}
          pointerHandlers={getHandleProps("hip")}
        />
        <Joint
          accentColor={accentColor}
          point={shoulder}
          pointerHandlers={getHandleProps("shoulder")}
        />
        <Joint
          accentColor={accentColor}
          point={leftKnee}
          pointerHandlers={getHandleProps("leftKnee")}
        />
        <Joint
          accentColor={accentColor}
          point={rightKnee}
          pointerHandlers={getHandleProps("rightKnee")}
        />
        <Joint
          accentColor={accentColor}
          point={arms.primaryElbow}
          pointerHandlers={getHandleProps("primaryElbow")}
        />
        <Joint
          accentColor={accentColor}
          point={arms.secondaryElbow}
          pointerHandlers={getHandleProps("secondaryElbow")}
        />
        <Hand
          accentColor={accentColor}
          point={arms.primaryHand}
          pointerHandlers={getHandleProps("primaryHand")}
        />
        <Hand
          accentColor={accentColor}
          point={arms.secondaryHand}
          pointerHandlers={getHandleProps("secondaryHand")}
        />
        <Foot
          accentColor={accentColor}
          point={leftFoot}
          pointerHandlers={getHandleProps("leftFoot")}
        />
        <Foot
          accentColor={accentColor}
          point={rightFoot}
          pointerHandlers={getHandleProps("rightFoot")}
        />
        <HandleDot
          accentColor={accentColor}
          point={head}
          radius={12}
          pointerHandlers={getHandleProps("head")}
        />

        {showActionMarker ? (
          <ActionMarker
            accentColor={accentColor}
            isAnimating={isAnimating}
            label={isShooter ? "Release" : "Contest"}
            point={arms.primaryHand}
          />
        ) : null}

        {!isShooter ? (
          <circle
            cx={arms.primaryHand.x}
            cy={arms.primaryHand.y - 12}
            r="9"
            fill={accentColor}
            opacity="0.85"
          />
        ) : null}
      </motion.g>

      <rect
        x={x - 52}
        y={y + 23}
        width="104"
        height="34"
        rx="8"
        fill="rgba(0,0,0,0.62)"
        stroke="rgba(255,255,255,0.16)"
      />
      <text
        x={x}
        y={y + 45}
        fill={accentColor}
        fontSize="14"
        fontWeight="900"
        textAnchor="middle"
      >
        {displayLabel}
      </text>
    </g>
  );
}

function ActionMarker({
  accentColor,
  isAnimating,
  label,
  point,
}: {
  accentColor: string;
  isAnimating: boolean;
  label: string;
  point: StickmanPoint;
}) {
  // This marker follows the active hand, making release and contest height
  // visible while the whole body group moves upward during a jump.
  return (
    <g>
      <motion.circle
        cx={point.x}
        cy={point.y}
        r="18"
        fill="none"
        stroke={accentColor}
        strokeDasharray="4 5"
        strokeWidth="3"
        initial={false}
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.94, 1.08, 0.94] }}
        transition={{
          duration: 1.2,
          repeat: isAnimating ? Infinity : 0,
          ease: "easeInOut",
        }}
      />
      <circle
        cx={point.x}
        cy={point.y}
        r="4"
        fill="#ffffff"
        stroke={accentColor}
        strokeWidth="2"
      />
      <text
        x={point.x + 17}
        y={point.y - 18}
        fill={accentColor}
        fontSize="11"
        fontWeight="900"
      >
        {label}
      </text>
    </g>
  );
}

function LimbPath({
  points,
  stroke,
  width,
}: {
  points: StickmanPoint[];
  stroke: string;
  width: number;
}) {
  return (
    <path
      d={`M ${points.map((point) => `${point.x} ${point.y}`).join("L")}`}
      fill="none"
      stroke={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={width}
    />
  );
}

function Joint({
  accentColor,
  point,
  pointerHandlers,
}: {
  accentColor: string;
  point: StickmanPoint;
  pointerHandlers?: PointerHandlers;
}) {
  return (
    <HandleDot
      accentColor={accentColor}
      point={point}
      radius={7}
      pointerHandlers={pointerHandlers}
    />
  );
}

function Hand({
  accentColor,
  point,
  pointerHandlers,
}: {
  accentColor: string;
  point: StickmanPoint;
  pointerHandlers?: PointerHandlers;
}) {
  return (
    <HandleDot
      accentColor="#fff7ed"
      fill={accentColor}
      point={point}
      radius={8}
      pointerHandlers={pointerHandlers}
    />
  );
}

function Foot({
  accentColor,
  point,
  pointerHandlers,
}: {
  accentColor: string;
  point: StickmanPoint;
  pointerHandlers?: PointerHandlers;
}) {
  return (
    <g>
      <line
        x1={point.x - 12}
        x2={point.x + 14}
        y1={point.y + 3}
        y2={point.y + 3}
        stroke={accentColor}
        strokeLinecap="round"
        strokeWidth="7"
      />
      <HandleDot
        accentColor={accentColor}
        point={{ x: point.x, y: point.y + 3 }}
        radius={6}
        pointerHandlers={pointerHandlers}
      />
    </g>
  );
}

type PointerHandlers = {
  onPointerCancel: (event: PointerEvent<SVGElement>) => void;
  onPointerDown: (event: PointerEvent<SVGElement>) => void;
  onPointerMove: (event: PointerEvent<SVGElement>) => void;
  onPointerUp: (event: PointerEvent<SVGElement>) => void;
};

function HandleDot({
  accentColor,
  fill = "#050505",
  point,
  pointerHandlers,
  radius,
}: {
  accentColor: string;
  fill?: string;
  point: StickmanPoint;
  pointerHandlers?: PointerHandlers;
  radius: number;
}) {
  return (
    <circle
      cx={point.x}
      cy={point.y}
      r={radius}
      fill={fill}
      stroke={accentColor}
      strokeWidth="3"
      style={{
        cursor: pointerHandlers ? "grab" : "default",
        pointerEvents: pointerHandlers ? "all" : "auto",
      }}
      {...pointerHandlers}
    />
  );
}

export function getStickmanGeometry({
  armRaise = 0,
  contestHeight = 0,
  guideHandAngle = 24,
  handHeight = 8.4,
  isAirborne,
  jumpHeight = 0,
  kneeBend,
  leftLegAngle = 0,
  releaseAngle = 48,
  rightLegAngle = 0,
  shootingArmAngle = 52,
  torsoAngle,
  type,
  verticalOffset,
  x,
  y,
}: Pick<
  StickmanPlayerProps,
  | "armRaise"
  | "contestHeight"
  | "guideHandAngle"
  | "handHeight"
  | "isAirborne"
  | "jumpHeight"
  | "kneeBend"
  | "leftLegAngle"
  | "releaseAngle"
  | "rightLegAngle"
  | "shootingArmAngle"
  | "torsoAngle"
  | "type"
  | "verticalOffset"
  | "x"
  | "y"
>): StickmanGeometry {
  const lift = Math.max(
    0,
    verticalOffset * 22 + (isAirborne ? jumpHeight * 4 + 12 : jumpHeight * 2),
  );
  const shadowWidth = Math.max(58, 120 - lift * 0.42);
  const shadowOpacity = Math.max(0.18, 0.48 - lift * 0.004);
  const hipHeight = Math.max(58, 92 - kneeBend * 0.42);
  const hip = { x, y: y - hipHeight };
  const shoulder = polarPoint(hip, -90 + torsoAngle, 72);
  const head = polarPoint(shoulder, -90 + torsoAngle * 0.35, 30);
  const leftFoot = {
    x: x - 34 - kneeBend * 0.12 + leftLegAngle * 0.34,
    y,
  };
  const rightFoot = {
    x: x + 34 + kneeBend * 0.12 + rightLegAngle * 0.34,
    y,
  };
  const leftKnee = kneePoint(hip, leftFoot, leftLegAngle, -1, kneeBend);
  const rightKnee = kneePoint(hip, rightFoot, rightLegAngle, 1, kneeBend);
  const arms =
    type === "shooter"
      ? buildShooterArms(
          shoulder,
          shootingArmAngle,
          guideHandAngle,
          handHeight,
          releaseAngle,
        )
      : buildDefenderArms(shoulder, armRaise, contestHeight);

  return {
    arms,
    head,
    hip,
    leftFoot,
    leftKnee,
    lift,
    rightFoot,
    rightKnee,
    shadowOpacity,
    shadowWidth,
    shoulder,
  };
}

export function getStickmanHitGeometry(
  geometry: StickmanGeometry,
): StickmanHitGeometry {
  const visible = {
    head: translateByLift(geometry.head, geometry.lift),
    hip: translateByLift(geometry.hip, geometry.lift),
    leftFoot: translateByLift(geometry.leftFoot, geometry.lift),
    leftKnee: translateByLift(geometry.leftKnee, geometry.lift),
    primaryElbow: translateByLift(geometry.arms.primaryElbow, geometry.lift),
    primaryHand: translateByLift(geometry.arms.primaryHand, geometry.lift),
    rightFoot: translateByLift(geometry.rightFoot, geometry.lift),
    rightKnee: translateByLift(geometry.rightKnee, geometry.lift),
    secondaryElbow: translateByLift(geometry.arms.secondaryElbow, geometry.lift),
    secondaryHand: translateByLift(geometry.arms.secondaryHand, geometry.lift),
    shoulder: translateByLift(geometry.shoulder, geometry.lift),
  };

  return {
    circles: [
      { point: visible.head, radius: 26 },
      { point: visible.primaryHand, radius: 15 },
      { point: visible.secondaryHand, radius: 14 },
      { point: visible.primaryElbow, radius: 12 },
      { point: visible.secondaryElbow, radius: 11 },
      { point: visible.leftKnee, radius: 11 },
      { point: visible.rightKnee, radius: 11 },
    ],
    segments: [
      { from: visible.hip, radius: 9, to: visible.shoulder },
      { from: visible.hip, radius: 9, to: visible.leftKnee },
      { from: visible.leftKnee, radius: 9, to: visible.leftFoot },
      { from: visible.hip, radius: 9, to: visible.rightKnee },
      { from: visible.rightKnee, radius: 9, to: visible.rightFoot },
      { from: visible.shoulder, radius: 10, to: visible.primaryElbow },
      { from: visible.primaryElbow, radius: 10, to: visible.primaryHand },
      { from: visible.shoulder, radius: 8, to: visible.secondaryElbow },
      { from: visible.secondaryElbow, radius: 8, to: visible.secondaryHand },
    ],
  };
}

function buildShooterArms(
  shoulder: StickmanPoint,
  shootingArmAngle: number,
  guideHandAngle: number,
  handHeight: number,
  releaseAngle: number,
) {
  // Shooter arms separate the release arm from the shorter guide hand. Release
  // angle rotates the shooting hand, and hand height adds a vertical reach boost
  // so both pose sliders have an immediate SVG effect.
  const heightBoost = (handHeight - 8.4) * 5;
  const releaseBoost = (releaseAngle - 48) * 0.28;
  const primaryElbow = polarPoint(
    shoulder,
    -82 + shootingArmAngle * 0.32 - releaseBoost * 0.35,
    42,
  );
  const primaryHandBase = polarPoint(
    primaryElbow,
    -96 + shootingArmAngle * 0.24 - releaseBoost,
    43,
  );
  const primaryHand = {
    x: primaryHandBase.x,
    y: primaryHandBase.y - heightBoost,
  };
  const secondaryElbow = polarPoint(shoulder, -52 + guideHandAngle * 0.28, 35);
  const secondaryHand = polarPoint(secondaryElbow, -38 + guideHandAngle * 0.18, 29);

  return {
    primaryElbow,
    primaryHand,
    secondaryElbow,
    secondaryHand,
  };
}

function buildDefenderArms(
  shoulder: StickmanPoint,
  armRaise: number,
  contestHeight: number,
) {
  // Defender's primary arm reaches upward for the contest while the off hand
  // stays wider for balance.
  const contestLength = 40 + contestHeight * 1.8;
  const primaryElbow = polarPoint(shoulder, -142 + armRaise * 0.52, 42);
  const primaryHand = polarPoint(primaryElbow, -132 + armRaise * 0.42, contestLength);
  const secondaryElbow = polarPoint(shoulder, 18, 34);
  const secondaryHand = polarPoint(secondaryElbow, 34, 32);

  return {
    primaryElbow,
    primaryHand,
    secondaryElbow,
    secondaryHand,
  };
}

function kneePoint(
  hip: StickmanPoint,
  foot: StickmanPoint,
  legAngle: number,
  side: -1 | 1,
  kneeBend: number,
) {
  // Knees sit between hip and foot, with pose sliders adding visible bend.
  return {
    x: hip.x + (foot.x - hip.x) * 0.48 + side * kneeBend * 0.16 + legAngle * 0.22,
    y: hip.y + (foot.y - hip.y) * 0.52 - kneeBend * 0.3,
  };
}

function polarPoint(
  origin: StickmanPoint,
  angleDegrees: number,
  length: number,
) {
  const angle = (angleDegrees * Math.PI) / 180;

  return {
    x: origin.x + Math.cos(angle) * length,
    y: origin.y + Math.sin(angle) * length,
  };
}

function translateByLift(point: StickmanPoint, lift: number) {
  return {
    x: point.x,
    y: point.y - lift,
  };
}

function getPointerStagePoint(
  event: PointerEvent<SVGElement>,
): StickmanPoint | null {
  const svg = event.currentTarget.ownerSVGElement;
  const screenMatrix = svg?.getScreenCTM();

  if (!svg || !screenMatrix) {
    return null;
  }

  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const transformedPoint = point.matrixTransform(screenMatrix.inverse());

  return {
    x: transformedPoint.x,
    y: transformedPoint.y,
  };
}
