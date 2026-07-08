"use client";

import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Snail } from "lucide-react";
import { motion } from "framer-motion";
import type { PointerEvent, ReactNode } from "react";
import type { SharedShotQuality, ShooterPoseState } from "@/store/useShotStore";
import { SHOOTING_ANIMATION_KEYFRAMES } from "@/lib/simulator-animation";
import {
  buildShotPath,
  getArcControlPoint,
  getBallVisualState,
  getFlightDuration,
  getReleasePoint,
  type ShotOutcomeKind,
} from "@/lib/simulator-physics";

export type { StagePoint } from "@/lib/simulator-physics";
import type { StagePoint } from "@/lib/simulator-physics";

type RimPoint = StagePoint;

type ShotArcProps = {
  aimTarget: RimPoint;
  blockPoint?: StagePoint | null;
  blockProgress?: number;
  epps: number;
  makeProbability: number;
  onAimTargetDrag: (point: StagePoint) => void;
  onArcControlDrag: (point: StagePoint) => void;
  outcome: ShotOutcomeKind;
  recommendation: string;
  releaseAngle: number;
  rim: RimPoint;
  shooterPose: ShooterPoseState;
  shooterStage: StagePoint;
  shotDistance: number;
  shotQuality: SharedShotQuality;
  isPlaying: boolean;
  timeline: number;
};

type ShotArcControlsProps = {
  activeStage: string;
  frameCount: number;
  frameIndex: number;
  isPlaying: boolean;
  isSlowMotion: boolean;
  onNextFrame: () => void;
  onPause: () => void;
  onPlay: () => void;
  onPreviousFrame: () => void;
  onReset: () => void;
  onTimelineChange: (value: number) => void;
  onToggleSlowMotion: () => void;
  timeline: number;
};

export function ShotArc({
  aimTarget,
  blockPoint,
  blockProgress,
  epps,
  makeProbability,
  onAimTargetDrag,
  onArcControlDrag,
  outcome,
  recommendation,
  releaseAngle,
  rim,
  shooterPose,
  shooterStage,
  shotDistance,
  shotQuality,
  isPlaying,
  timeline,
}: ShotArcProps) {
  // ShotArc intentionally uses a readable Bezier approximation. It explains
  // release shape without pretending to be a full ballistics simulation.
  const releasePoint = getReleasePoint({ shooterPose, shooterStage });
  const shotTarget = aimTarget;
  const controlPoint = getArcControlPoint({
    releaseAngle,
    releasePoint,
    rim: shotTarget,
    shotDistance,
  });
  const arcPath = buildShotPath({
    releaseAngle,
    releasePoint,
    rim: shotTarget,
    shotDistance,
  });
  const visual = getBallVisualState({
    outcome,
    progress: timeline,
    releaseAngle,
    releasePoint,
    rim: shotTarget,
    shotDistance,
    blockPoint,
    blockProgress,
  });
  const flightDuration = getFlightDuration(shotDistance);

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
        d={`M ${releasePoint.x} ${releasePoint.y} L ${shotTarget.x} ${shotTarget.y}`}
        stroke="rgba(255,255,255,0.18)"
        strokeDasharray="4 9"
        strokeLinecap="round"
        strokeWidth="2"
      />

      <RimOutcomeEffects isPlaying={isPlaying} rim={rim} visual={visual} />
      <Basketball
        ball={visual.ball}
        flightDuration={flightDuration}
        isPlaying={isPlaying}
      />
      <ArcDragHandle
        label="Adjust shot height"
        point={controlPoint}
        tone="height"
        onDrag={onArcControlDrag}
      />
      <ArcDragHandle
        label="Adjust shot direction"
        point={shotTarget}
        tone="target"
        onDrag={onAimTargetDrag}
      />

      <ShotResultCallout
        epps={epps}
        outcomeLabel={visual.label}
        makeProbability={makeProbability}
        recommendation={recommendation}
        shotQuality={shotQuality}
      />
    </g>
  );
}

export function ShotArcControls({
  activeStage,
  frameCount,
  frameIndex,
  isPlaying,
  isSlowMotion,
  onNextFrame,
  onPause,
  onPlay,
  onPreviousFrame,
  onReset,
  onTimelineChange,
  onToggleSlowMotion,
  timeline,
}: ShotArcControlsProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-black/30 p-3 sm:min-w-[25rem]">
      <div className="grid grid-cols-6 gap-2">
        <ControlButton label="Previous Frame" onClick={onPreviousFrame}>
          <ChevronLeft className="size-4" />
        </ControlButton>
        <ControlButton active={isPlaying} label="Play" onClick={onPlay}>
          <Play className="size-4" />
        </ControlButton>
        <ControlButton active={!isPlaying} label="Pause" onClick={onPause}>
          <Pause className="size-4" />
        </ControlButton>
        <ControlButton label="Replay" onClick={onReset}>
          <RotateCcw className="size-4" />
        </ControlButton>
        <ControlButton label="Next Frame" onClick={onNextFrame}>
          <ChevronRight className="size-4" />
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
          <span>{activeStage}</span>
          <span>
            Frame {frameIndex + 1}/{frameCount} / {timeline}%
          </span>
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

      <div className="grid grid-cols-7 gap-1.5">
        {SHOOTING_ANIMATION_KEYFRAMES.map((frame, index) => {
          const next = SHOOTING_ANIMATION_KEYFRAMES[index + 1];
          const isActive =
            timeline >= frame.progress &&
            timeline <= (next?.progress ?? frame.progress);

          return (
            <button
              key={frame.id}
              type="button"
              onClick={() => onTimelineChange(frame.progress)}
              className={`rounded-md border px-2 py-1.5 text-center text-[11px] font-black uppercase tracking-[0.08em] ${
                isActive
                  ? "border-orange-300/45 bg-orange-500/20 text-orange-100"
                  : "border-white/10 bg-white/[0.04] text-slate-500"
              }`}
            >
              {frame.label.split(" ")[0]}
            </button>
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

function Basketball({
  ball,
  flightDuration,
  isPlaying,
}: {
  ball: StagePoint;
  flightDuration: number;
  isPlaying: boolean;
}) {
  // The basketball follows the same Bezier point used by the arc path, keeping
  // the visible motion aligned with the drawn explanation curve.
  return (
    <motion.g
      initial={false}
      animate={{ rotate: [0, 28, 0], scale: [1, 1.04, 1] }}
      style={{ originX: `${ball.x}px`, originY: `${ball.y}px` }}
      transition={{
        duration: flightDuration / 1000,
        ease: "easeInOut",
        repeat: isPlaying ? Infinity : 0,
      }}
    >
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
    </motion.g>
  );
}

function RimOutcomeEffects({
  isPlaying,
  rim,
  visual,
}: {
  isPlaying: boolean;
  rim: StagePoint;
  visual: ReturnType<typeof getBallVisualState>;
}) {
  // These small effects sell the outcome visually without simulating true
  // contact physics: net snap for makes, rim pulse, and backboard flash.
  return (
    <g>
      {visual.rimPulse ? (
        <motion.ellipse
          cx={rim.x}
          cy={rim.y}
          rx="38"
          ry="13"
          fill="none"
          stroke="#fdba74"
          strokeWidth="4"
          initial={false}
          animate={{ opacity: [0.85, 0.18], scale: [1, 1.18] }}
          transition={{ duration: 0.42, repeat: isPlaying ? Infinity : 0 }}
        />
      ) : null}
      {visual.swish ? (
        <motion.path
          d={`M ${rim.x - 21} ${rim.y + 9}c12 35 34 35 47 0`}
          fill="none"
          stroke="#e0f2fe"
          strokeLinecap="round"
          strokeWidth="4"
          initial={false}
          animate={{ opacity: [0.35, 1, 0.35], y: [0, 8, 0] }}
          transition={{ duration: 0.6, repeat: isPlaying ? Infinity : 0 }}
        />
      ) : null}
      {visual.backboardFlash ? (
        <motion.rect
          x={rim.x + 10}
          y={rim.y - 70}
          width="52"
          height="52"
          rx="4"
          fill="rgba(255,255,255,0.16)"
          stroke="#bae6fd"
          strokeWidth="3"
          initial={false}
          animate={{ opacity: [0.15, 0.7, 0.15] }}
          transition={{ duration: 0.48, repeat: isPlaying ? Infinity : 0 }}
        />
      ) : null}
      <text
        x={rim.x - 72}
        y={rim.y + 70}
        fill="#fed7aa"
        fontSize="13"
        fontWeight="900"
      >
        {visual.label}
      </text>
    </g>
  );
}

function ArcDragHandle({
  label,
  onDrag,
  point,
  tone,
}: {
  label: string;
  onDrag: (point: StagePoint) => void;
  point: StagePoint;
  tone: "height" | "target";
}) {
  const handlePointerDown = (event: PointerEvent<SVGCircleElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const stagePoint = getPointerStagePoint(event);

    if (stagePoint) {
      onDrag(stagePoint);
    }
  };
  const handlePointerMove = (event: PointerEvent<SVGCircleElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    const stagePoint = getPointerStagePoint(event);

    if (stagePoint) {
      onDrag(stagePoint);
    }
  };
  const releasePointer = (event: PointerEvent<SVGCircleElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <g>
      <circle
        cx={point.x}
        cy={point.y}
        r={tone === "height" ? 14 : 12}
        fill={tone === "height" ? "rgba(250,204,21,0.3)" : "rgba(251,146,60,0.32)"}
        stroke={tone === "height" ? "#facc15" : "#fed7aa"}
        strokeDasharray={tone === "height" ? "6 5" : undefined}
        strokeWidth="4"
        aria-label={label}
        role="slider"
        tabIndex={0}
        style={{ cursor: "grab", pointerEvents: "all", touchAction: "none" }}
        onPointerCancel={releasePointer}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={releasePointer}
      />
      <circle
        cx={point.x}
        cy={point.y}
        r="4"
        fill="#fff7ad"
        pointerEvents="none"
      />
    </g>
  );
}

function ShotResultCallout({
  epps,
  makeProbability,
  outcomeLabel,
  recommendation,
  shotQuality,
}: {
  epps: number;
  makeProbability: number;
  outcomeLabel: string;
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
        Quality: {shotQuality} / {outcomeLabel}
      </text>
      <text x="48" y="126" fill="rgba(226,232,240,0.72)" fontSize="12">
        {recommendation.length > 36
          ? `${recommendation.slice(0, 35)}...`
          : recommendation}
      </text>
    </g>
  );
}

const qualityStroke: Record<SharedShotQuality, string> = {
  Average: "#facc15",
  Bad: "#f87171",
  Excellent: "#4ade80",
  Good: "#34d399",
  Poor: "#fb923c",
};

function getPointerStagePoint(
  event: PointerEvent<SVGCircleElement>,
): StagePoint | null {
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
