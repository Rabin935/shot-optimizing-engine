"use client";

import {
  Activity,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PoseControls } from "@/components/simulator/PoseControls";
import { StickmanPlayer } from "@/components/simulator/StickmanPlayer";
import {
  useShotStore,
  type DefenderPoseState,
  type SharedShotQuality,
  type ShooterPoseState,
} from "@/store/useShotStore";

const STAGE_WIDTH = 920;
const STAGE_HEIGHT = 520;
const FLOOR_Y = 418;
const RIM = { x: 792, y: 178 };
const SHOOTER_PEAK_ELEVATION = { jumpHeight: 9.2, verticalOffset: 1.45 };
const DEFENDER_PEAK_ELEVATION = { jumpHeight: 8.4, verticalOffset: 1.2 };

const FALLBACK_DEFENDER_POSE: DefenderPoseState = {
  armRaise: 64,
  contestHeight: 8.8,
  isAirborne: false,
  jumpHeight: 0,
  kneeBend: 18,
  leanAngle: 0,
  stanceWidth: 2.8,
  torsoAngle: 0,
  verticalOffset: 0,
};

export function SimulatorStateControls() {
  // This component is the Phase 5 simulator shell that consumes shared shot state.
  const shooter = useShotStore((state) => state.shooter);
  const defenders = useShotStore((state) => state.defenders);
  const activeDefenderCount = useShotStore(
    (state) => state.activeDefenderCount,
  );
  const shooterPose = useShotStore((state) => state.shooterPose);
  const defenderPoses = useShotStore((state) => state.defenderPoses);
  const shotDistance = useShotStore((state) => state.shotDistance);
  const shotAngle = useShotStore((state) => state.shotAngle);
  const shotZone = useShotStore((state) => state.shotZone);
  const pressureLevel = useShotStore((state) => state.pressureLevel);
  const makeProbability = useShotStore((state) => state.makeProbability);
  const epps = useShotStore((state) => state.epps);
  const shotQuality = useShotStore((state) => state.shotQuality);
  const recommendation = useShotStore((state) => state.recommendation);
  const confidence = useShotStore((state) => state.confidence);
  const predictionSource = useShotStore((state) => state.predictionSource);
  const setShooterPosition = useShotStore((state) => state.setShooterPosition);
  const setDefenderPosition = useShotStore((state) => state.setDefenderPosition);
  const updateShooterPose = useShotStore((state) => state.updateShooterPose);
  const updateDefenderPose = useShotStore((state) => state.updateDefenderPose);
  const resetShot = useShotStore((state) => state.resetShot);
  const resetPoses = useShotStore((state) => state.resetPoses);
  const [timeline, setTimeline] = useState(62);
  const [isPlaying, setIsPlaying] = useState(false);
  const shooterJumpTimers = useRef<number[]>([]);
  const defenderJumpTimers = useRef<number[]>([]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    // The simulator is still synthetic, so a small client timer is enough to
    // preview the shot release without adding real physics or backend coupling.
    const intervalId = window.setInterval(() => {
      setTimeline((current) => (current >= 100 ? 0 : current + 1));
    }, 45);

    return () => window.clearInterval(intervalId);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      clearQueuedTimers(shooterJumpTimers);
      clearQueuedTimers(defenderJumpTimers);
    };
  }, []);

  const activeDefenders = defenders.slice(0, activeDefenderCount);
  const primaryDefender = activeDefenders[0];
  const primaryDefenderPose =
    defenderPoses[primaryDefender?.id ?? "d1"] ?? FALLBACK_DEFENDER_POSE;
  const shooterStage = useMemo(
    // Map court feet from the shared store into the synthetic side-view stage.
    () => mapCourtPointToStage(shooter.x, shooter.y),
    [shooter.x, shooter.y],
  );
  const defenderStage = useMemo(
    () =>
      primaryDefender
        ? mapCourtPointToStage(primaryDefender.x, primaryDefender.y)
        : { x: 530, y: FLOOR_Y },
    [primaryDefender],
  );
  const runShooterJump = useCallback(() => {
    // A jump shot is staged as crouch/takeoff, peak release, and landing.
    // It writes to the same Zustand pose state that the sliders control.
    clearQueuedTimers(shooterJumpTimers);
    setIsPlaying(false);
    setTimeline(50);
    updateShooterPose(
      {
        isAirborne: true,
        jumpHeight: 4.5,
        kneeBend: 18,
        verticalOffset: 0.45,
      },
      "simulator",
    );
    queueElevationStep(shooterJumpTimers, 240, () => {
      setTimeline(62);
      updateShooterPose(
        {
          guideHandAngle: 30,
          isAirborne: true,
          jumpHeight: SHOOTER_PEAK_ELEVATION.jumpHeight,
          kneeBend: 8,
          shootingArmAngle: 76,
          verticalOffset: SHOOTER_PEAK_ELEVATION.verticalOffset,
        },
        "simulator",
      );
    });
    queueElevationStep(shooterJumpTimers, 760, () => {
      updateShooterPose(
        {
          isAirborne: true,
          jumpHeight: 4,
          kneeBend: 20,
          verticalOffset: 0.45,
        },
        "simulator",
      );
    });
    queueElevationStep(shooterJumpTimers, 1080, () => {
      updateShooterPose(
        {
          isAirborne: false,
          jumpHeight: 0,
          verticalOffset: 0,
        },
        "simulator",
      );
    });
  }, [updateShooterPose]);

  const runDefenderContestJump = useCallback(() => {
    // Defender contest uses the same elevation sequence, with a raised hand
    // and contest height emphasized at the hang point.
    clearQueuedTimers(defenderJumpTimers);
    updateDefenderPose(
      primaryDefender?.id ?? "d1",
      {
        armRaise: 78,
        isAirborne: true,
        jumpHeight: 3.8,
        kneeBend: 14,
        verticalOffset: 0.35,
      },
      "simulator",
    );
    queueElevationStep(defenderJumpTimers, 220, () => {
      updateDefenderPose(
        primaryDefender?.id ?? "d1",
        {
          armRaise: 96,
          contestHeight: 10.8,
          isAirborne: true,
          jumpHeight: DEFENDER_PEAK_ELEVATION.jumpHeight,
          kneeBend: 6,
          verticalOffset: DEFENDER_PEAK_ELEVATION.verticalOffset,
        },
        "simulator",
      );
    });
    queueElevationStep(defenderJumpTimers, 740, () => {
      updateDefenderPose(
        primaryDefender?.id ?? "d1",
        {
          armRaise: 80,
          isAirborne: true,
          jumpHeight: 3.2,
          kneeBend: 16,
          verticalOffset: 0.3,
        },
        "simulator",
      );
    });
    queueElevationStep(defenderJumpTimers, 1060, () => {
      updateDefenderPose(
        primaryDefender?.id ?? "d1",
        {
          isAirborne: false,
          jumpHeight: 0,
          verticalOffset: 0,
        },
        "simulator",
      );
    });
  }, [primaryDefender?.id, updateDefenderPose]);

  const resetElevation = useCallback(() => {
    // Reset elevation only lands the players; it leaves user-tuned angles intact.
    clearQueuedTimers(shooterJumpTimers);
    clearQueuedTimers(defenderJumpTimers);
    updateShooterPose(
      { isAirborne: false, jumpHeight: 0, verticalOffset: 0 },
      "simulator",
    );
    updateDefenderPose(
      primaryDefender?.id ?? "d1",
      { isAirborne: false, jumpHeight: 0, verticalOffset: 0 },
      "simulator",
    );
  }, [primaryDefender?.id, updateDefenderPose, updateShooterPose]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl xl:sticky xl:top-5 xl:self-start">
        <div className="flex flex-col gap-3 border-b border-white/10 bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-orange-300/25 bg-orange-500/10 text-orange-100">
              <Activity className="size-5" />
            </span>
            <div>
              <p className="text-sm font-black text-white">
                Phase 5 Mechanics Stage
              </p>
              <p className="text-xs text-slate-400">
                {shotZone} / {pressureLevel} / {predictionSource}
              </p>
            </div>
          </div>
          <TimelineControls
            isPlaying={isPlaying}
            timeline={timeline}
            onReset={() => {
              setTimeline(0);
              setIsPlaying(false);
            }}
            onTimelineChange={setTimeline}
            onTogglePlay={() => setIsPlaying((current) => !current)}
          />
        </div>

        <SimulatorStage
          defenderPose={primaryDefenderPose}
          defenderStage={defenderStage}
          makeProbability={makeProbability}
          shooterPose={shooterPose}
          shooterStage={shooterStage}
          shotQuality={shotQuality}
          timeline={timeline}
        />

        <div className="grid gap-3 border-t border-white/10 bg-black/20 p-4 text-sm md:grid-cols-4">
          <MetricPill
            icon={<Target className="size-4" />}
            label="Zone"
            tone={shotZone === "Three Point" ? "green" : "orange"}
            value={shotZone}
          />
          <MetricPill
            icon={<Shield className="size-4" />}
            label="Pressure"
            tone={pressureLevel.includes("Tight") ? "red" : "neutral"}
            value={pressureLevel}
          />
          <MetricPill
            icon={<Gauge className="size-4" />}
            label="Make Prob"
            tone={makeProbability >= 0.5 ? "green" : "neutral"}
            value={`${(makeProbability * 100).toFixed(1)}%`}
          />
          <MetricPill
            icon={<Activity className="size-4" />}
            label="EPPS"
            tone={epps >= 1.1 ? "green" : epps >= 0.85 ? "orange" : "red"}
            value={epps.toFixed(2)}
          />
        </div>
      </section>

      <aside className="grid gap-4 xl:sticky xl:top-5 xl:max-h-[calc(100vh-2.5rem)] xl:self-start xl:overflow-y-auto xl:pr-1">
        <PoseControls
          onDefenderContestJump={runDefenderContestJump}
          onResetElevation={resetElevation}
          onShooterJump={runShooterJump}
        />

        <ShotInfoPanel
          confidence={confidence}
          epps={epps}
          makeProbability={makeProbability}
          predictionSource={predictionSource}
          pressureLevel={pressureLevel}
          recommendation={recommendation}
          shotAngle={shotAngle}
          shotDistance={shotDistance}
          shotQuality={shotQuality}
          shotZone={shotZone}
        />

        <PositionControlPanel
          primaryDefender={primaryDefender}
          resetPoses={resetPoses}
          resetShot={resetShot}
          setDefenderPosition={setDefenderPosition}
          setShooterPosition={setShooterPosition}
          shooter={shooter}
        />
      </aside>
    </div>
  );
}

function SimulatorStage({
  defenderPose,
  defenderStage,
  makeProbability,
  shooterPose,
  shooterStage,
  shotQuality,
  timeline,
}: {
  defenderPose: DefenderPoseState;
  defenderStage: StagePoint;
  makeProbability: number;
  shooterPose: ShooterPoseState;
  shooterStage: StagePoint;
  shotQuality: SharedShotQuality;
  timeline: number;
}) {
  // Stage is an SVG prototype, not a physics engine; it visualizes shared state.
  const ball = getBallPosition(shooterStage, timeline);
  const shotPath = buildShotPath(shooterStage);

  return (
    <div className="relative bg-[#10160f]">
      <svg
        className="block h-[360px] w-full sm:h-[460px] xl:h-[560px]"
        viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
        role="img"
        aria-label="2D stickman basketball simulator with shooter, defender, rim, and ball arc"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="sim-floor" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#1f3a24" />
            <stop offset="0.55" stopColor="#132116" />
            <stop offset="1" stopColor="#0b0f0d" />
          </linearGradient>
          <filter id="sim-orange-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="sim-green-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="url(#sim-floor)" />
        <CourtBackground />
        <Basket />

        <path
          d={shotPath}
          fill="none"
          stroke={qualityStroke[shotQuality]}
          strokeDasharray="10 10"
          strokeLinecap="round"
          strokeWidth="4"
          filter="url(#sim-orange-glow)"
          opacity="0.78"
        />
        <path
          d={`M ${shooterStage.x + 38} ${shooterStage.y - 122} L ${RIM.x} ${RIM.y}`}
          stroke="rgba(255,255,255,0.18)"
          strokeDasharray="4 9"
          strokeLinecap="round"
          strokeWidth="2"
        />

        <StickmanPlayer
          color="#fb923c"
          glowFilter="url(#sim-orange-glow)"
          guideHandAngle={shooterPose.guideHandAngle}
          handHeight={shooterPose.handHeight}
          isAirborne={shooterPose.isAirborne}
          jumpHeight={shooterPose.jumpHeight}
          kneeBend={shooterPose.kneeBend}
          label="Shooter"
          leftLegAngle={shooterPose.leftLegAngle}
          releaseAngle={shooterPose.releaseAngle}
          rightLegAngle={shooterPose.rightLegAngle}
          shootingArmAngle={shooterPose.shootingArmAngle}
          torsoAngle={shooterPose.torsoAngle}
          type="shooter"
          verticalOffset={shooterPose.verticalOffset}
          x={shooterStage.x}
          y={shooterStage.y}
        />
        <StickmanPlayer
          armRaise={defenderPose.armRaise}
          contestHeight={defenderPose.contestHeight}
          color="#4ade80"
          glowFilter="url(#sim-green-glow)"
          isAirborne={defenderPose.isAirborne}
          jumpHeight={defenderPose.jumpHeight}
          kneeBend={defenderPose.kneeBend}
          label="Defender"
          leftLegAngle={-defenderPose.stanceWidth * 7 + defenderPose.leanAngle * 0.2}
          rightLegAngle={defenderPose.stanceWidth * 7 + defenderPose.leanAngle * 0.2}
          torsoAngle={defenderPose.torsoAngle + defenderPose.leanAngle}
          type="defender"
          verticalOffset={defenderPose.verticalOffset}
          x={defenderStage.x}
          y={defenderStage.y}
        />

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

        <g>
          <rect
            x="28"
            y="28"
            width="220"
            height="70"
            rx="10"
            fill="rgba(0,0,0,0.56)"
            stroke="rgba(255,255,255,0.14)"
          />
          <text x="48" y="57" fill="#fed7aa" fontSize="15" fontWeight="900">
            Synthetic Phase 5 Preview
          </text>
          <text x="48" y="82" fill="rgba(226,232,240,0.78)" fontSize="13">
            P(make): {(makeProbability * 100).toFixed(1)}%
          </text>
        </g>
      </svg>
    </div>
  );
}

function CourtBackground() {
  // Draws a simple side-view court floor and guide lines behind the players.
  return (
    <g>
      <rect
        x="44"
        y={FLOOR_Y}
        width="832"
        height="54"
        rx="8"
        fill="rgba(190,123,61,0.58)"
        stroke="rgba(255,255,255,0.14)"
      />
      <path
        d={`M 74 ${FLOOR_Y}H846M160 ${FLOOR_Y}v54M460 ${FLOOR_Y}v54M760 ${FLOOR_Y}v54`}
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="2"
      />
      <path
        d="M80 362C226 322 358 326 496 360S730 400 852 358"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeDasharray="9 16"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </g>
  );
}

function Basket() {
  // Rim and backboard stay fixed for now while poses and shot arc update.
  return (
    <g>
      <line
        x1="828"
        x2="828"
        y1="88"
        y2="211"
        stroke="rgba(255,255,255,0.82)"
        strokeLinecap="round"
        strokeWidth="8"
      />
      <rect
        x="790"
        y="110"
        width="70"
        height="48"
        rx="4"
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(255,255,255,0.48)"
        strokeWidth="4"
      />
      <ellipse
        cx={RIM.x}
        cy={RIM.y}
        rx="34"
        ry="10"
        fill="none"
        stroke="#fb923c"
        strokeWidth="7"
        filter="url(#sim-orange-glow)"
      />
      <path
        d={`M ${RIM.x - 27} ${RIM.y + 5}c15 24 43 24 56 0`}
        fill="none"
        stroke="rgba(255,255,255,0.34)"
        strokeWidth="2"
      />
    </g>
  );
}

function ShotInfoPanel({
  confidence,
  epps,
  makeProbability,
  predictionSource,
  pressureLevel,
  recommendation,
  shotAngle,
  shotDistance,
  shotQuality,
  shotZone,
}: {
  confidence: string;
  epps: number;
  makeProbability: number;
  predictionSource: string;
  pressureLevel: string;
  recommendation: string;
  shotAngle: number;
  shotDistance: number;
  shotQuality: SharedShotQuality;
  shotZone: string;
}) {
  // Right-side panel mirrors the latest global shot result from the store.
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Shot Information
          </p>
          <h2 className="mt-1 text-xl font-black text-white">{shotQuality}</h2>
        </div>
        <span className={`rounded-md border px-2.5 py-1 text-xs font-black ${qualityBadge[shotQuality]}`}>
          {predictionSource}
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        <InfoRow label="Make Probability" value={`${(makeProbability * 100).toFixed(1)}%`} />
        <InfoRow label="EPPS" value={epps.toFixed(2)} />
        <InfoRow label="Zone" value={shotZone} />
        <InfoRow label="Pressure" value={pressureLevel} />
        <InfoRow label="Distance" value={`${shotDistance.toFixed(1)} ft`} />
        <InfoRow label="Angle" value={`${shotAngle.toFixed(1)} deg`} />
        <InfoRow label="Confidence" value={confidence} />
      </div>
      <div className="mt-4 rounded-lg border border-green-300/20 bg-green-400/10 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-200">
          Recommendation
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-200">
          {recommendation}
        </p>
      </div>
    </section>
  );
}

function PositionControlPanel({
  primaryDefender,
  resetPoses,
  resetShot,
  setDefenderPosition,
  setShooterPosition,
  shooter,
}: {
  primaryDefender: { id: string; x: number; y: number } | undefined;
  resetPoses: (source?: "sandbox" | "simulator" | "backend" | "system") => void;
  resetShot: (source?: "sandbox" | "simulator" | "backend" | "system") => void;
  setDefenderPosition: (
    defenderId: string,
    position: { x: number; y: number },
    source?: "sandbox" | "simulator" | "backend" | "system",
  ) => void;
  setShooterPosition: (
    position: { x: number; y: number },
    source?: "sandbox" | "simulator" | "backend" | "system",
  ) => void;
  shooter: { x: number; y: number };
}) {
  // Position controls prove simulator edits can flow back into the court sandbox.
  return (
    <section className="rounded-lg border border-white/10 bg-black/30 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Shared Position Controls
        </p>
        <div className="flex gap-2">
          <IconButton label="Reset Shot" onClick={() => resetShot("simulator")}>
            <RotateCcw className="size-4" />
          </IconButton>
          <IconButton label="Reset Poses" onClick={() => resetPoses("simulator")}>
            <RotateCcw className="size-4" />
          </IconButton>
        </div>
      </div>
      <div className="mt-4 grid gap-4">
        <RangeControl
          label="Shooter X"
          max={50}
          min={0}
          step={0.1}
          value={shooter.x}
          onChange={(x) => setShooterPosition({ ...shooter, x }, "simulator")}
        />
        <RangeControl
          label="Shooter Y"
          max={47}
          min={0}
          step={0.1}
          value={shooter.y}
          onChange={(y) => setShooterPosition({ ...shooter, y }, "simulator")}
        />
        {primaryDefender ? (
          <>
            <RangeControl
              label="Defender X"
              max={50}
              min={0}
              step={0.1}
              value={primaryDefender.x}
              onChange={(x) =>
                setDefenderPosition(
                  primaryDefender.id,
                  { x, y: primaryDefender.y },
                  "simulator",
                )
              }
            />
            <RangeControl
              label="Defender Y"
              max={47}
              min={0}
              step={0.1}
              value={primaryDefender.y}
              onChange={(y) =>
                setDefenderPosition(
                  primaryDefender.id,
                  { x: primaryDefender.x, y },
                  "simulator",
                )
              }
            />
          </>
        ) : null}
      </div>
    </section>
  );
}

function TimelineControls({
  isPlaying,
  onReset,
  onTimelineChange,
  onTogglePlay,
  timeline,
}: {
  isPlaying: boolean;
  onReset: () => void;
  onTimelineChange: (value: number) => void;
  onTogglePlay: () => void;
  timeline: number;
}) {
  // Timeline is a manual prototype control that moves the ball along the arc.
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/30 p-3 sm:min-w-80">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onTogglePlay}
          className="grid size-10 place-items-center rounded-lg border border-green-300/25 bg-green-400/10 text-green-100 transition hover:bg-green-400/20"
          aria-label={isPlaying ? "Pause timeline" : "Play timeline"}
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          Release Timeline {timeline}%
        </span>
        <button
          type="button"
          onClick={onReset}
          className="grid size-10 place-items-center rounded-lg border border-orange-300/25 bg-orange-500/10 text-orange-100 transition hover:bg-orange-500/20"
          aria-label="Reset timeline"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={timeline}
        onChange={(event) => onTimelineChange(Number(event.target.value))}
        className="h-2 w-full accent-green-300"
      />
    </div>
  );
}

function RangeControl({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  // Range controls update shared store values without local duplicated state.
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        <span>{label}</span>
        <span className="text-slate-200">{value.toFixed(1)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full accent-orange-400"
      />
    </label>
  );
}

function MetricPill({
  icon,
  label,
  tone,
  value,
}: {
  icon: ReactNode;
  label: string;
  tone: "green" | "orange" | "red" | "neutral";
  value: string;
}) {
  // Stage footer metrics summarize the live shared shot state.
  return (
    <div className={`flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2 ${toneClasses[tone]}`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-current/20 bg-black/20">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-70">
          {label}
        </p>
        <p className="truncate text-sm font-black text-white">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  // Compact stat row for the shot information panel.
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span className="truncate text-sm font-black text-white">{value}</span>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  // Icon-only controls stay compact while retaining accessible labels.
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-200 transition hover:border-orange-300/35 hover:text-orange-100"
    >
      {children}
    </button>
  );
}

type StagePoint = {
  x: number;
  y: number;
};

function clearQueuedTimers(timerBucket: { current: number[] }) {
  // Cancel queued jump phases so repeated button presses never fight each other.
  timerBucket.current.forEach((timerId) => window.clearTimeout(timerId));
  timerBucket.current = [];
}

function queueElevationStep(
  timerBucket: { current: number[] },
  delay: number,
  updatePose: () => void,
) {
  // Store timeout ids so reset/unmount can cancel unfinished jump animations.
  const timerId = window.setTimeout(updatePose, delay);
  timerBucket.current.push(timerId);
}

function mapCourtPointToStage(x: number, y: number): StagePoint {
  // Convert court coordinates into a readable side-view stage position.
  return {
    x: 118 + (x / 50) * 560,
    y: FLOOR_Y - Math.min(y / 47, 1) * 58,
  };
}

function buildShotPath(shooterStage: StagePoint) {
  // Simple quadratic arc from shooter hand area to the rim.
  const startX = shooterStage.x + 42;
  const startY = shooterStage.y - 126;
  const controlX = (startX + RIM.x) / 2;
  const controlY = Math.min(startY, RIM.y) - 138;

  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${RIM.x} ${RIM.y}`;
}

function getBallPosition(shooterStage: StagePoint, timeline: number) {
  // Approximate the ball path with a quadratic Bezier point calculation.
  const t = timeline / 100;
  const start = { x: shooterStage.x + 42, y: shooterStage.y - 126 };
  const control = {
    x: (start.x + RIM.x) / 2,
    y: Math.min(start.y, RIM.y) - 138,
  };
  const oneMinusT = 1 - t;

  return {
    x:
      oneMinusT * oneMinusT * start.x +
      2 * oneMinusT * t * control.x +
      t * t * RIM.x,
    y:
      oneMinusT * oneMinusT * start.y +
      2 * oneMinusT * t * control.y +
      t * t * RIM.y,
  };
}

const qualityStroke: Record<SharedShotQuality, string> = {
  Average: "#facc15",
  Bad: "#f87171",
  Excellent: "#4ade80",
  Good: "#34d399",
  Poor: "#fb923c",
};

const qualityBadge: Record<SharedShotQuality, string> = {
  Average: "border-yellow-300/30 bg-yellow-400/10 text-yellow-100",
  Bad: "border-red-300/35 bg-red-500/15 text-red-100",
  Excellent: "border-green-300/35 bg-green-400/15 text-green-100",
  Good: "border-emerald-300/35 bg-emerald-400/15 text-emerald-100",
  Poor: "border-orange-300/35 bg-orange-500/15 text-orange-100",
};

const toneClasses = {
  green: "border-green-300/25 bg-green-400/10 text-green-100",
  neutral: "border-white/10 bg-black/30 text-slate-200",
  orange: "border-orange-300/25 bg-orange-500/10 text-orange-100",
  red: "border-red-300/25 bg-red-500/10 text-red-100",
};
