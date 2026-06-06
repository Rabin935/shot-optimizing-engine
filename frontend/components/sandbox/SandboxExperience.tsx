"use client";

import { useMemo, useState } from "react";
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

const INITIAL_SHOOTER: CourtPoint = { x: 38, y: 26 };
const INITIAL_DEFENDERS: SandboxDefender[] = [
  { id: "d1", label: "D1", point: { x: 33, y: 23 }, tone: "red" },
  { id: "d2", label: "D2", point: { x: 18, y: 20 }, tone: "blue" },
];

const INITIAL_TOGGLES: SandboxToggles = {
  analyticsOverlay: true,
  courtLabels: true,
  defenderRadius: true,
  shotLine: true,
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
  const [shooter, setShooter] = useState<CourtPoint>(INITIAL_SHOOTER);
  const [defenders, setDefenders] =
    useState<SandboxDefender[]>(INITIAL_DEFENDERS);
  const [toggles, setToggles] = useState<SandboxToggles>(INITIAL_TOGGLES);
  const [activeScenario, setActiveScenario] = useState("wing-pullup");
  const [defenderCount, setDefenderCount] = useState<1 | 2>(2);
  const activeDefenders = useMemo(
    () => defenders.slice(0, defenderCount),
    [defenderCount, defenders],
  );
  const stats = useMemo(
    () => calculateSandboxStats(shooter, activeDefenders),
    [activeDefenders, shooter],
  );
  const predictionRequest = useMemo(
    () => buildShotPredictionRequest(shooter, stats),
    [shooter, stats],
  );
  const { isBackendOffline, isLoading, prediction, status } =
    useShotPrediction(predictionRequest, { debounceMs: 400 });
  const displayedProbability =
    prediction?.make_probability ?? stats.makeProbability;
  const displayedQuality = normalizeShotQuality(
    prediction?.shot_quality,
    stats.shotQuality,
  );

  const handleDefenderMove = (id: string, point: CourtPoint) => {
    setDefenders((current) =>
      current.map((defender) =>
        defender.id === id ? { ...defender, point } : defender,
      ),
    );
    setActiveScenario("custom");
  };

  const handleToggleSetting = (key: keyof SandboxToggles) => {
    setToggles((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const resetPositions = () => {
    setShooter(INITIAL_SHOOTER);
    setDefenders(INITIAL_DEFENDERS);
    setDefenderCount(2);
    setToggles(INITIAL_TOGGLES);
    setActiveScenario("wing-pullup");
  };

  const applyScenario = (scenario: SandboxScenario) => {
    setShooter(scenario.shooter);
    setDefenders(
      scenario.defenders.map((defender) => ({
        ...defender,
        point: { ...defender.point },
      })),
    );
    setDefenderCount(2);
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
              setDefenderCount((current) => (current === 1 ? 2 : 1))
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
              setShooter(point);
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

function buildShotPredictionRequest(
  shooter: CourtPoint,
  stats: SandboxStats,
): ShotPredictionRequest {
  const closestDefender =
    stats.defenderDistances.find(
      (defender) => defender.id === stats.closestDefenderId,
    ) ?? null;
  const defenderPoint = closestDefender?.point ?? shooter;
  const defenderDistance = Number.isFinite(stats.closestDefenderDistance)
    ? stats.closestDefenderDistance
    : 99;

  return {
    defender_distance: roundMetric(defenderDistance),
    defender_x: roundMetric(defenderPoint.x),
    defender_y: roundMetric(defenderPoint.y),
    pressure_level: toBackendPressureLevel(stats.defenderPressure),
    shooter_x: roundMetric(shooter.x),
    shooter_y: roundMetric(shooter.y),
    shot_angle: roundMetric(calculateShotAngle(shooter)),
    shot_distance: roundMetric(stats.distanceToBasket),
    shot_value: stats.shotValue,
    shot_zone: toBackendShotZone(stats.shotZone, stats.shotValue),
  };
}

function calculateShotAngle(shooter: CourtPoint) {
  const dx = BASKET_LOCATION.x - shooter.x;
  const dy = BASKET_LOCATION.y - shooter.y;
  const angle = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);

  return Math.min(angle, 180);
}

function toBackendShotZone(shotZone: ShotZone, shotValue: 2 | 3) {
  if (shotValue === 3) {
    return "Three Point";
  }

  return shotZone;
}

function toBackendPressureLevel(pressure: DefenderPressure) {
  if (pressure === "Moderate") {
    return "Tight";
  }

  return pressure;
}

function normalizeShotQuality(
  quality: string | undefined,
  fallback: ShotQuality,
): ShotQuality {
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

function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}

function BackendBadge({
  status,
}: {
  status: "idle" | "loading" | "connected" | "offline";
}) {
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
