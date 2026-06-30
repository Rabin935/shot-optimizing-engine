"use client";

import { Pause, Play, RotateCcw, Snail } from "lucide-react";
import type { ReactNode } from "react";
import type { SharedShotQuality, ShooterPoseState } from "@/store/useShotStore";

export type StagePoint = {
  x: number;
  y: number;
};

type RimPoint = StagePoint;

type ShotArcProps = {
  epps: number;
  makeProbability: number;
  recommendation: string;
  releaseAngle: number;
  rim: RimPoint;
  shooterPose: ShooterPoseState;
  shooterStage: StagePoint;
  shotDistance: number;
  shotQuality: SharedShotQuality;
  timeline: number;
};

type ShotArcControlsProps = {
  isPlaying: boolean;
  isSlowMotion: boolean;
  onPause: () => void;
  onPlay: () => void;
  onReset: () => void;
  onTimelineChange: (value: number) => void;
  onToggleSlowMotion: () => void;
  timeline: number;
};

const TIMELINE_STEPS = [
  { label: "Set", max: 19, min: 0 },
  { label: "Jump", max: 39, min: 20 },
  { label: "Release", max: 55, min: 40 },
  { label: "Flight", max: 89, min: 56 },
  { label: "Result", max: 100, min: 90 },
];

export function ShotArc({
  epps,
  makeProbability,
  recommendation,
  releaseAngle,
  rim,
  shooterPose,
  shooterStage,
  shotDistance,
  shotQuality,
  timeline,
}: ShotArcProps) {
  // ShotArc intentionally uses a readable Bezier approximation. It explains
  // release shape without pretending to be a full ballistics simulation.
  const releasePoint = getReleasePoint(shooterStage, shooterPose);
  const arcPath = buildShotPath({
    releaseAngle,
    releasePoint,
    rim,
    shotDistance,
  });
  const ball = getBallPosition({
    releaseAngle,
    releasePoint,
    rim,
    shotDistance,
    timeline,
  });

  return (
    <g>
      <path
        d={arcPath}
        fill="none"
        stroke={qualityStroke[shotQuality]}
        strokeDasharray="10 10"
        strokeLinecap="round"
        strokeWidth="4"
        filter="url(#sim-orange-glow)"
        opacity="0.82"
      />
      <path
        d={`M ${releasePoint.x} ${releasePoint.y} L ${rim.x} ${rim.y}`}
        stroke="rgba(255,255,255,0.18)"
        strokeDasharray="4 9"
        strokeLinecap="round"
        strokeWidth="2"
      />

      <Basketball ball={ball} />

      <ShotResultCallout
        epps={epps}
        makeProbability={makeProbability}
        recommendation={recommendation}
        shotQuality={shotQuality}
      />
    </g>
  );
}

export function ShotArcControls({
  isPlaying,
  isSlowMotion,
  onPause,
  onPlay,
  onReset,
  onTimelineChange,
  onToggleSlowMotion,
  timeline,
}: ShotArcControlsProps) {
  const activeStep = getTimelineStep(timeline);

  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-black/30 p-3 sm:min-w-[25rem]">
      <div className="grid grid-cols-4 gap-2">
        <ControlButton active={isPlaying} label="Play" onClick={onPlay}>
          <Play className="size-4" />
        </ControlButton>
        <ControlButton active={!isPlaying} label="Pause" onClick={onPause}>
          <Pause className="size-4" />
        </ControlButton>
        <ControlButton label="Reset" onClick={onReset}>
          <RotateCcw className="size-4" />
        </ControlButton>
        <ControlButton
          active={isSlowMotion}
          label="Slow Motion"
          onClick={onToggleSlowMotion}
        >
          <Snail className="size-4" />
        </ControlButton>
      </div>

      <label className="grid gap-2">
        <span className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          <span>{activeStep} Timeline</span>
          <span>{timeline}%</span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={timeline}
          onChange={(event) => onTimelineChange(Number(event.target.value))}
          className="h-2 w-full accent-green-300"
        />
      </label>

      <div className="grid grid-cols-5 gap-1.5">
        {TIMELINE_STEPS.map((step) => {
          const isActive = timeline >= step.min && timeline <= step.max;

          return (
            <div
              key={step.label}
              className={`rounded-md border px-2 py-1.5 text-center text-[11px] font-black uppercase tracking-[0.08em] ${
                isActive
                  ? "border-orange-300/45 bg-orange-500/20 text-orange-100"
                  : "border-white/10 bg-white/[0.04] text-slate-500"
              }`}
            >
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ControlButton({
  active = false,
  children,
  label,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-black transition ${
        active
          ? "border-green-300/35 bg-green-400/15 text-green-100"
          : "border-white/10 bg-white/[0.05] text-slate-200 hover:border-orange-300/35 hover:text-orange-100"
      }`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Basketball({ ball }: { ball: StagePoint }) {
  // The basketball follows the same Bezier point used by the arc path, keeping
  // the visible motion aligned with the drawn explanation curve.
  return (
    <g>
      <circle
        cx={ball.x}
        cy={ball.y}
        r="15"
        fill="#ff6a00"
        stroke="#fed7aa"
        strokeWidth="3"
        filter="url(#sim-orange-glow)"
      />
      <path
        d={`M ${ball.x - 11} ${ball.y}h22M${ball.x} ${ball.y - 11}v22M${ball.x - 8} ${ball.y - 8}c9 7 12 15 11 21M${ball.x + 8} ${ball.y - 8}c-9 7-12 15-11 21`}
        stroke="#431407"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </g>
  );
}

function ShotResultCallout({
  epps,
  makeProbability,
  recommendation,
  shotQuality,
}: {
  epps: number;
  makeProbability: number;
  recommendation: string;
  shotQuality: SharedShotQuality;
}) {
  // The callout keeps the key prediction outputs visible while users scrub the
  // release timeline and explain why the simulated look is good or poor.
  return (
    <g>
      <rect
        x="28"
        y="28"
        width="250"
        height="112"
        rx="10"
        fill="rgba(0,0,0,0.58)"
        stroke="rgba(255,255,255,0.14)"
      />
      <text x="48" y="57" fill="#fed7aa" fontSize="15" fontWeight="900">
        Synthetic Release Preview
      </text>
      <text x="48" y="82" fill="rgba(226,232,240,0.86)" fontSize="13">
        P(make): {(makeProbability * 100).toFixed(1)}% / EPPS {epps.toFixed(2)}
      </text>
      <text x="48" y="105" fill={qualityStroke[shotQuality]} fontSize="13" fontWeight="900">
        Quality: {shotQuality}
      </text>
      <text x="48" y="126" fill="rgba(226,232,240,0.72)" fontSize="12">
        {recommendation.length > 36
          ? `${recommendation.slice(0, 35)}...`
          : recommendation}
      </text>
    </g>
  );
}

function getReleasePoint(
  shooterStage: StagePoint,
  shooterPose: ShooterPoseState,
): StagePoint {
  // This mirrors the stickman arm intent closely enough that the arc begins at
  // the visible release hand while still staying simple and explainable.
  const lift =
    Math.max(
      0,
      shooterPose.verticalOffset * 22 +
        (shooterPose.isAirborne
          ? shooterPose.jumpHeight * 4 + 12
          : shooterPose.jumpHeight * 2),
    ) || 0;
  const releaseReach = (shooterPose.releaseAngle - 48) * 0.42;
  const handHeightBoost = (shooterPose.handHeight - 8.4) * 5;

  return {
    x: shooterStage.x + 42 + releaseReach,
    y: shooterStage.y - 126 - lift - handHeightBoost,
  };
}

function buildShotPath({
  releaseAngle,
  releasePoint,
  rim,
  shotDistance,
}: {
  releaseAngle: number;
  releasePoint: StagePoint;
  rim: RimPoint;
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

function getBallPosition({
  releaseAngle,
  releasePoint,
  rim,
  shotDistance,
  timeline,
}: {
  releaseAngle: number;
  releasePoint: StagePoint;
  rim: RimPoint;
  shotDistance: number;
  timeline: number;
}) {
  // Quadratic Bezier interpolation gives a smooth professional-looking arc
  // without introducing physics constants this phase does not need yet.
  const t = timeline / 100;
  const control = getArcControlPoint({
    releaseAngle,
    releasePoint,
    rim,
    shotDistance,
  });
  const oneMinusT = 1 - t;

  return {
    x:
      oneMinusT * oneMinusT * releasePoint.x +
      2 * oneMinusT * t * control.x +
      t * t * rim.x,
    y:
      oneMinusT * oneMinusT * releasePoint.y +
      2 * oneMinusT * t * control.y +
      t * t * rim.y,
  };
}

function getArcControlPoint({
  releaseAngle,
  releasePoint,
  rim,
  shotDistance,
}: {
  releaseAngle: number;
  releasePoint: StagePoint;
  rim: RimPoint;
  shotDistance: number;
}) {
  // Higher release angle and longer shot distance lift the control point,
  // making the same simple curve communicate both arc height and shot length.
  const distanceLift = Math.min(Math.max(shotDistance, 8), 32) * 3.8;
  const angleLift = (releaseAngle - 20) * 2.1;

  return {
    x: (releasePoint.x + rim.x) / 2,
    y: Math.min(releasePoint.y, rim.y) - 48 - distanceLift - angleLift,
  };
}

function getTimelineStep(timeline: number) {
  return (
    TIMELINE_STEPS.find((step) => timeline >= step.min && timeline <= step.max)
      ?.label ?? "Set"
  );
}

const qualityStroke: Record<SharedShotQuality, string> = {
  Average: "#facc15",
  Bad: "#f87171",
  Excellent: "#4ade80",
  Good: "#34d399",
  Poor: "#fb923c",
};
