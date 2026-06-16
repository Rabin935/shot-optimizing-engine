"use client";

import { motion } from "framer-motion";

type PlayerType = "shooter" | "defender";

type Point = {
  x: number;
  y: number;
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
  armRaise?: number;
  contestHeight?: number;
  isAirborne: boolean;
  jumpHeight?: number;
  color?: string;
  glowFilter?: string;
  label?: string;
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
  isAirborne,
  jumpHeight = 0,
  kneeBend,
  label,
  leftLegAngle = 0,
  rightLegAngle = 0,
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
  const lift = Math.max(
    0,
    verticalOffset * 22 + (isAirborne ? jumpHeight * 4 + 12 : jumpHeight * 2),
  );
  const shadowWidth = Math.max(58, 120 - lift * 0.42);
  const shadowOpacity = Math.max(0.18, 0.48 - lift * 0.004);

  // Geometry is built from the floor anchor, then the whole body group is
  // translated upward. That keeps the stickman free to jump while the shadow
  // remains on the court and shows the current height.
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
  const arms = isShooter
    ? buildShooterArms(shoulder, shootingArmAngle, guideHandAngle)
    : buildDefenderArms(shoulder, armRaise, contestHeight);

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

        {[hip, shoulder, leftKnee, rightKnee, arms.primaryElbow, arms.secondaryElbow].map(
          (point, index) => (
            <Joint
              key={`${type}-joint-${index}`}
              accentColor={accentColor}
              point={point}
            />
          ),
        )}
        {[arms.primaryHand, arms.secondaryHand].map((point, index) => (
          <Hand key={`${type}-hand-${index}`} accentColor={accentColor} point={point} />
        ))}
        {[leftFoot, rightFoot].map((point, index) => (
          <Foot key={`${type}-foot-${index}`} accentColor={accentColor} point={point} />
        ))}

        {showActionMarker ? (
          <ActionMarker
            accentColor={accentColor}
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
  label,
  point,
}: {
  accentColor: string;
  label: string;
  point: Point;
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
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
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
  points: Point[];
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
}: {
  accentColor: string;
  point: Point;
}) {
  return (
    <circle
      cx={point.x}
      cy={point.y}
      r="7"
      fill="#050505"
      stroke={accentColor}
      strokeWidth="3"
    />
  );
}

function Hand({
  accentColor,
  point,
}: {
  accentColor: string;
  point: Point;
}) {
  return (
    <circle
      cx={point.x}
      cy={point.y}
      r="8"
      fill={accentColor}
      stroke="#fff7ed"
      strokeWidth="2"
    />
  );
}

function Foot({
  accentColor,
  point,
}: {
  accentColor: string;
  point: Point;
}) {
  return (
    <line
      x1={point.x - 12}
      x2={point.x + 14}
      y1={point.y + 3}
      y2={point.y + 3}
      stroke={accentColor}
      strokeLinecap="round"
      strokeWidth="7"
    />
  );
}

function buildShooterArms(
  shoulder: Point,
  shootingArmAngle: number,
  guideHandAngle: number,
) {
  // Shooter arms separate the release arm from the shorter guide hand.
  const primaryElbow = polarPoint(shoulder, -82 + shootingArmAngle * 0.32, 42);
  const primaryHand = polarPoint(primaryElbow, -96 + shootingArmAngle * 0.24, 43);
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
  shoulder: Point,
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
  hip: Point,
  foot: Point,
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

function polarPoint(origin: Point, angleDegrees: number, length: number) {
  const angle = (angleDegrees * Math.PI) / 180;

  return {
    x: origin.x + Math.cos(angle) * length,
    y: origin.y + Math.sin(angle) * length,
  };
}
