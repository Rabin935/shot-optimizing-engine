"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Activity, Crosshair, Gauge, Shield } from "lucide-react";
import { SandboxCourt } from "@/components/sandbox/SandboxCourt";
import {
  SandboxControls,
  type SandboxScenario,
  type SandboxToggles,
} from "@/components/sandbox/SandboxControls";
import { StatsPanel } from "@/components/sandbox/StatsPanel";
import {
  BASKET_LOCATION,
  calculateSandboxStats,
  type CourtPoint,
  type DefenderPressure,
  type SandboxDefender,
  type SandboxStats,
  type ShotQuality,
  type ShotZone,
} from "@/lib/sandbox-metrics";
import { useShotPrediction } from "@/hooks/useShotPrediction";
import type { ShotPredictionRequest } from "@/lib/api/shotPrediction";
import {
  useShotStore,
  type PredictionSource,
  type SharedPressureLevel,
  type SharedShotZone,
  type ShotDefenderPosition,
} from "@/store/useShotStore";

const INITIAL_TOGGLES: SandboxToggles = {
  analyticsOverlay: true,
  courtLabels: true,
  defenderRadius: true,
  shotLine: true,
};

const DEFENDER_DISPLAY: Record<
  string,
  Pick<SandboxDefender, "label" | "tone">
> = {
  d1: { label: "D1", tone: "red" },
  d2: { label: "D2", tone: "blue" },
};

const SCENARIOS = [
  {
    id: "corner-three",
    label: "Corner 3",
    shooter: { x: 47, y: 11 },
    defenders: [
      { id: "d1", label: "D1", point: { x: 42.5, y: 12 }, tone: "red" },
      { id: "d2", label: "D2", point: { x: 31, y: 18.5 }, tone: "blue" },
    ],
  },
  {
    id: "paint-touch",
    label: "Paint Touch",
    shooter: { x: 25, y: 8 },
    defenders: [
      { id: "d1", label: "D1", point: { x: 25, y: 10.8 }, tone: "red" },
      { id: "d2", label: "D2", point: { x: 31, y: 15 }, tone: "blue" },
    ],
  },
  {
    id: "wing-pullup",
    label: "Wing Pull-Up",
    shooter: { x: 38, y: 26 },
    defenders: [
      { id: "d1", label: "D1", point: { x: 33, y: 23 }, tone: "red" },
      { id: "d2", label: "D2", point: { x: 18, y: 20 }, tone: "blue" },
    ],
  },
  {
    id: "top-key",
    label: "Top Key 3",
    shooter: { x: 25, y: 29 },
    defenders: [
      { id: "d1", label: "D1", point: { x: 25, y: 23.5 }, tone: "red" },
      { id: "d2", label: "D2", point: { x: 34, y: 22 }, tone: "blue" },
    ],
  },
] satisfies SandboxScenario[];

export function SandboxExperience() {
  // Zustand owns shared shot state so sandbox and simulator can stay in sync.
  const shooter = useShotStore((state) => state.shooter);
  const defenderPositions = useShotStore((state) => state.defenders);
  const defenderCount = useShotStore((state) => state.activeDefenderCount);
  const setShooterPosition = useShotStore((state) => state.setShooterPosition);
  const setDefenderPosition = useShotStore((state) => state.setDefenderPosition);
  const setDefenderCount = useShotStore((state) => state.setDefenderCount);
  const updateShotMetrics = useShotStore((state) => state.updateShotMetrics);
  const updatePredictionResult = useShotStore(
    (state) => state.updatePredictionResult,
  );
  const resetShot = useShotStore((state) => state.resetShot);
  const [toggles, setToggles] = useState<SandboxToggles>(INITIAL_TOGGLES);
  const [activeScenario, setActiveScenario] = useState("wing-pullup");
  const defenders = useMemo(
    // Add display-only metadata to the shared defender coordinates.
    () => defenderPositions.map(toSandboxDefender),
    [defenderPositions],
  );
  const activeDefenders = useMemo(
    // Defender count controls whether one or two defenders affect the model.
    () => defenders.slice(0, defenderCount),
    [defenderCount, defenders],
  );
  const stats = useMemo(
    // Recalculate local analytics whenever the shooter or active defenders move.
    () => calculateSandboxStats(shooter, activeDefenders),
    [activeDefenders, shooter],
  );
  const predictionRequest = useMemo(
    // Convert local sandbox stats into the backend API request format.
    () => buildShotPredictionRequest(shooter, stats),
    [shooter, stats],
  );
  const { isBackendOffline, isLoading, prediction, status } =
    // Debounced hook keeps backend predictions in sync with court movement.
    useShotPrediction(predictionRequest, { debounceMs: 400 });
  const displayedProbability =
    prediction?.make_probability ?? stats.makeProbability;
  const displayedQuality = normalizeShotQuality(
    prediction?.shot_quality,
    stats.shotQuality,
  );

  useEffect(() => {
    // Publish local sandbox metrics to the shared store for simulator consumers.
    updateShotMetrics(
      {
        closestDefenderDistance: roundMetric(stats.closestDefenderDistance),
        confidence: "Local estimate",
        epps: roundMetric(stats.expectedPoints),
        makeProbability: stats.makeProbability,
        predictionSource: "local_estimate",
        pressureLevel: toSharedPressureLevel(stats.defenderPressure),
        recommendation: stats.recommendation.message,
        shotAngle: roundMetric(calculateShotAngle(shooter)),
        shotDistance: roundMetric(stats.distanceToBasket),
        shotQuality: stats.shotQuality,
        shotValue: stats.shotValue,
        shotZone: toSharedShotZone(stats.shotZone, stats.shotValue),
      },
      "sandbox",
    );
  }, [shooter, stats, updateShotMetrics]);

  useEffect(() => {
    if (!prediction) {
      return;
    }

    // Publish backend ML/fallback prediction results without changing local visuals.
    updatePredictionResult(
      {
        confidence: prediction.confidence,
        epps: prediction.epps,
        makeProbability: prediction.make_probability,
        predictionSource: normalizePredictionSource(
          prediction.prediction_source,
        ),
        recommendation: prediction.recommendation,
        shotQuality: normalizeShotQuality(
          prediction.shot_quality,
          stats.shotQuality,
        ),
      },
      "backend",
    );
  }, [prediction, stats.shotQuality, updatePredictionResult]);

  const handleDefenderMove = (id: string, point: CourtPoint) => {
    // Update only the moved defender in the shared store and mark layout custom.
    setDefenderPosition(id, point, "sandbox");
    setActiveScenario("custom");
  };

  const handleToggleSetting = (key: keyof SandboxToggles) => {
    // Flip one overlay/control setting while preserving the rest.
    setToggles((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const resetPositions = () => {
    // Restore the shared shot position plus local-only UI toggles.
    resetShot("sandbox");
    setToggles(INITIAL_TOGGLES);
    setActiveScenario("wing-pullup");
  };

  const applyScenario = (scenario: SandboxScenario) => {
    // Copy scenario coordinates into state so later dragging does not mutate presets.
    setShooterPosition(scenario.shooter, "sandbox");
    scenario.defenders.forEach((defender) => {
      setDefenderPosition(defender.id, defender.point, "sandbox");
    });
    setDefenderCount(2, "sandbox");
    setActiveScenario(scenario.id);
  };

  return (
    <motion.div
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <section className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl">
        <div className="border-b border-white/10 bg-black/20 p-3 sm:p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
              <span className="h-2 w-2 rounded-full bg-green-300 shadow-[0_0_12px_rgba(134,239,172,0.7)]" />
              Live court sandbox
            </div>
            <BackendBadge status={status} />
          </div>

          <SandboxControls
            activeScenario={activeScenario}
            defenderCount={defenderCount}
            onApplyScenario={applyScenario}
            onReset={resetPositions}
            onToggleDefenderCount={() =>
              setDefenderCount(defenderCount === 1 ? 2 : 1, "sandbox")
            }
            onToggleSetting={handleToggleSetting}
            scenarios={SCENARIOS}
            stats={stats}
            toggles={toggles}
          />
        </div>

        <div className="p-3 sm:p-5">
          <div className="mb-4 grid gap-3 text-sm md:grid-cols-4">
            <StatusChip
              icon={<Gauge className="size-4" />}
              label="Make Prob"
              tone={displayedProbability >= 0.5 ? "green" : "neutral"}
              value={
                isLoading
                  ? "Calculating..."
                  : prediction?.make_probability_percent ??
                    `${(stats.makeProbability * 100).toFixed(1)}%`
              }
            />
            <StatusChip
              icon={<Crosshair className="size-4" />}
              label="Zone"
              tone={stats.shotValue === 3 ? "green" : "orange"}
              value={stats.shotZone}
            />
            <StatusChip
              icon={<Shield className="size-4" />}
              label="Pressure"
              tone={stats.closestDefenderDistance <= 4 ? "red" : "neutral"}
              value={stats.defenderPressure}
            />
            <StatusChip
              icon={<Activity className="size-4" />}
              label="Quality"
              tone={
                displayedQuality === "Excellent" || displayedQuality === "Good"
                  ? "green"
                  : displayedQuality === "Bad"
                    ? "red"
                    : "orange"
              }
              value={isLoading ? "Calculating..." : displayedQuality}
            />
          </div>

          <SandboxCourt
            defenders={activeDefenders}
            onDefenderMove={handleDefenderMove}
            onShooterMove={(point) => {
              setShooterPosition(point, "sandbox");
              setActiveScenario("custom");
            }}
            shooter={shooter}
            showAnalyticsOverlay={toggles.analyticsOverlay}
            showCourtLabels={toggles.courtLabels}
            showDefenderRadius={toggles.defenderRadius}
            showShotLine={toggles.shotLine}
            stats={stats}
          />
        </div>
      </section>

      <StatsPanel
        backendStatus={status}
        isBackendOffline={isBackendOffline}
        isPredictionLoading={isLoading}
        prediction={prediction}
        shooter={shooter}
        stats={stats}
      />
    </motion.div>
  );
}

function toSandboxDefender(defender: ShotDefenderPosition): SandboxDefender {
  // Keep visual labels/colors outside the shared data model.
  const display = DEFENDER_DISPLAY[defender.id] ?? {
    label: defender.id.toUpperCase(),
    tone: "blue" as const,
  };

  return {
    id: defender.id,
    label: display.label,
    point: { x: defender.x, y: defender.y },
    tone: display.tone,
  };
}

function buildShotPredictionRequest(
  shooter: CourtPoint,
  stats: SandboxStats,
): ShotPredictionRequest {
  // Find the closest defender because the backend request expects one defender.
  const closestDefender =
    stats.defenderDistances.find(
      (defender) => defender.id === stats.closestDefenderId,
    ) ?? null;
  const defenderPoint = closestDefender?.point ?? shooter;
  const defenderDistance = Number.isFinite(stats.closestDefenderDistance)
    // Use a large distance when no defender is available.
    ? stats.closestDefenderDistance
    : 99;

  return {
    defender_distance: roundMetric(defenderDistance),
    defender_x: roundMetric(defenderPoint.x),
    defender_y: roundMetric(defenderPoint.y),
    dribbles: 1,
    period: 4,
    pressure_level: toBackendPressureLevel(stats.defenderPressure),
    shooter_x: roundMetric(shooter.x),
    shooter_y: roundMetric(shooter.y),
    shot_clock: 12,
    shot_angle: roundMetric(calculateShotAngle(shooter)),
    shot_distance: roundMetric(stats.distanceToBasket),
    shot_value: stats.shotValue,
    shot_zone: toBackendShotZone(stats.shotZone, stats.shotValue),
    touch_time: 2.5,
  };
}

function calculateShotAngle(shooter: CourtPoint) {
  // Measure shot angle from the shooter to the basket and clamp to API range.
  const dx = BASKET_LOCATION.x - shooter.x;
  const dy = BASKET_LOCATION.y - shooter.y;
  const angle = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);

  return Math.min(angle, 180);
}

function toBackendShotZone(shotZone: ShotZone, shotValue: 2 | 3) {
  // Collapse frontend three-point subzones into the backend's Three Point label.
  if (shotValue === 3) {
    return "Three Point";
  }

  return shotZone;
}

function toSharedShotZone(
  shotZone: ShotZone,
  shotValue: 2 | 3,
): SharedShotZone {
  // The shared store uses the same three broad zones as backend prediction.
  return toBackendShotZone(shotZone, shotValue) as SharedShotZone;
}

function toBackendPressureLevel(pressure: DefenderPressure) {
  // Backend model uses Tight instead of the frontend-only Moderate bucket.
  if (pressure === "Moderate") {
    return "Tight";
  }

  return pressure;
}

function toSharedPressureLevel(pressure: DefenderPressure): SharedPressureLevel {
  // Convert the frontend-only Moderate bucket into the backend/store Tight bucket.
  return toBackendPressureLevel(pressure) as SharedPressureLevel;
}

function normalizeShotQuality(
  quality: string | undefined,
  fallback: ShotQuality,
): ShotQuality {
  // Keep frontend styling safe if backend returns an unexpected label.
  if (
    quality === "Excellent" ||
    quality === "Good" ||
    quality === "Average" ||
    quality === "Poor" ||
    quality === "Bad"
  ) {
    return quality;
  }

  return fallback;
}

function normalizePredictionSource(source: string | undefined): PredictionSource {
  // Keep unknown backend values from breaking simulator consumers.
  if (source === "ml_model" || source === "rule_based_fallback") {
    return source;
  }

  return "prediction_engine";
}

function roundMetric(value: number) {
  // Round coordinates and metrics to keep the API payload compact.
  return Math.round(value * 100) / 100;
}

function BackendBadge({
  status,
}: {
  status: "idle" | "loading" | "connected" | "offline";
}) {
  // BackendBadge summarizes the live prediction connection state.
  const badge = backendBadgeContent[status];

  return (
    <span
      className={`w-fit rounded-md border px-2.5 py-1 text-xs font-black uppercase tracking-[0.16em] ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

function StatusChip({
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
  // Status chips show the most important live values above the court.
  return (
    <div className={`flex min-h-14 items-center gap-3 rounded-lg border px-4 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.18)] ${statusTone[tone]}`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-current/20 bg-black/20">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">
          {label}
        </p>
        <p className="truncate font-black text-white">{value}</p>
      </div>
    </div>
  );
}

const statusTone = {
  green: "border-green-300/25 bg-green-400/10 text-green-100",
  neutral: "border-white/10 bg-black/30 text-slate-200",
  orange: "border-orange-300/25 bg-orange-500/10 text-orange-100",
  red: "border-red-300/25 bg-red-500/10 text-red-100",
};

const backendBadgeContent = {
  connected: {
    className: "border-green-300/25 bg-green-400/10 text-green-100",
    label: "Backend connected",
  },
  idle: {
    className: "border-white/10 bg-white/[0.06] text-slate-200",
    label: "Backend ready",
  },
  loading: {
    className: "border-sky-300/25 bg-sky-500/10 text-sky-100",
    label: "Checking backend",
  },
  offline: {
    className: "border-red-300/30 bg-red-500/10 text-red-100",
    label: "Backend offline",
  },
};
