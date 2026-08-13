"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Crosshair,
  Gauge,
  Layers,
  Medal,
  Ruler,
  Shield,
  Target,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { RecommendationCard } from "@/components/sandbox/RecommendationCard";
import type {
  CourtPoint,
  DefenderPressure,
  SandboxStats,
  ShotRecommendation,
  ShotQuality,
} from "@/lib/sandbox-metrics";
import type { ShotPredictionConnectionStatus } from "@/hooks/useShotPrediction";
import type { ShotPredictionResponse } from "@/lib/api/shotPrediction";
import { formatDistanceByUnits } from "@/lib/settings-preferences";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useMotionSettings } from "@/hooks/useMotionSettings";

type StatsPanelProps = {
  backendStatus: ShotPredictionConnectionStatus;
  isBackendOffline: boolean;
  isPredictionLoading: boolean;
  prediction: ShotPredictionResponse | null;
  shooter: CourtPoint;
  stats: SandboxStats;
};

export function StatsPanel({
  backendStatus,
  isBackendOffline,
  isPredictionLoading,
  prediction,
  shooter,
  stats,
}: StatsPanelProps) {
  const units = useSettingsStore((state) => state.settings.units);
  const { transition } = useMotionSettings();
  const displayQuality = normalizeShotQuality(
    prediction?.shot_quality,
    stats.shotQuality,
  );
  const displayProbability = prediction?.make_probability ?? stats.makeProbability;
  const displayEpps = prediction?.epps ?? stats.expectedPoints;
  const displayShotValue = prediction?.shot_value ?? stats.shotValue;
  const probability = displayProbability * 100;
  const eppsMeter = Math.min((displayEpps / 1.45) * 100, 100);
  const recommendation = getDisplayRecommendation(
    isPredictionLoading,
    prediction,
    stats.recommendation,
    displayQuality,
  );
  const predictionSourceLabel = getPredictionSourceLabel(
    prediction?.prediction_source,
  );

  return (
    <motion.aside
      className="rounded-lg border border-[color:var(--line)] bg-panel p-4 shadow-[var(--shadow-panel)] backdrop-blur-xl sm:p-5 lg:sticky lg:top-5 lg:self-start"
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08, ...transition(0.42) }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg border border-green-300/25 bg-green-400/10 text-green-100">
            <Gauge className="size-5" />
          </span>
          <div>
            <p className="text-sm font-black text-white">Live Shot Model</p>
            <p className="text-xs text-slate-400">
              {backendStatus === "connected"
                ? "FastAPI Phase 4 backend"
                : "Local fallback ready"}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {prediction && predictionSourceLabel ? (
            <span className="max-w-36 rounded-md border border-white/10 bg-white/[0.07] px-2.5 py-1 text-right text-[11px] font-black leading-tight text-slate-200">
              {predictionSourceLabel}
            </span>
          ) : null}
          <span className={`rounded-md border px-2.5 py-1 text-xs font-black ${qualityBadge[displayQuality]}`}>
            {isPredictionLoading ? "Calculating" : displayQuality}
          </span>
        </div>
      </div>

      {isBackendOffline ? (
        <div className="mt-4 rounded-lg border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">
          Backend offline — using local estimate
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <HeroMetric
          icon={<Activity className="size-5" />}
          label="Make Probability"
          tone={probability >= 50 ? "green" : probability >= 38 ? "orange" : "red"}
          value={
            isPredictionLoading
              ? "Calculating..."
              : prediction?.make_probability_percent ??
                `${probability.toFixed(1)}%`
          }
        />
        <HeroMetric
          icon={<Target className="size-5" />}
          label="EPPS"
          tone={
            displayEpps >= 1.15
              ? "green"
              : displayEpps >= 0.9
                ? "orange"
                : "red"
          }
          value={isPredictionLoading ? "Calculating..." : displayEpps.toFixed(2)}
        />
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            EPPS Strength
          </p>
          <TrendingUp className="size-5 text-green-200" />
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className={`h-full rounded-full shadow-[0_0_18px_rgba(74,222,128,0.45)] ${eppsBarTone[displayQuality]}`}
            initial={false}
            animate={{ width: `${eppsMeter}%` }}
            transition={{ type: "spring", stiffness: 170, damping: 24 }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          <span>Low</span>
          <span>Elite</span>
        </div>
      </div>

      <div className="mt-4">
        <RecommendationCard recommendation={recommendation} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <StatTile
          icon={<Target className="size-5" />}
          label="Shot Value"
          tone={displayShotValue === 3 ? "green" : "neutral"}
          value={`${displayShotValue} points`}
        />
        <StatTile
          icon={<Crosshair className="size-5" />}
          label="Shot Zone"
          tone={stats.shotValue === 3 ? "green" : "orange"}
          value={stats.shotZone}
        />
        <StatTile
          icon={<Ruler className="size-5" />}
          label="Distance to Basket"
          tone="neutral"
          value={formatDistanceByUnits(stats.distanceToBasket, units)}
        />
        <StatTile
          icon={<Shield className="size-5" />}
          label="Closest Defender"
          tone={stats.closestDefenderDistance <= 4 ? "red" : "neutral"}
          value={formatDistanceByUnits(stats.closestDefenderDistance, units)}
        />
        <StatTile
          icon={<Layers className="size-5" />}
          label="Pressure Level"
          tone={pressureTone[stats.defenderPressure]}
          value={stats.defenderPressure}
        />
        <StatTile
          icon={<Medal className="size-5" />}
          label="Shot Quality"
          tone={qualityTone[displayQuality]}
          value={isPredictionLoading ? "Calculating..." : displayQuality}
        />
        <StatTile
          icon={<Gauge className="size-5" />}
          label="Confidence"
          tone={getConfidenceTone(prediction?.confidence)}
          value={prediction?.confidence ?? "Local estimate"}
        />
      </div>

      <details className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4 text-sm">
        <summary className="cursor-pointer select-none text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 outline-none transition hover:text-slate-200">
          Coordinates / Debug Info
        </summary>
        <div className="mt-4 grid gap-2">
          <DebugRow label="Shooter X" value={formatDistanceByUnits(shooter.x, units)} />
          <DebugRow label="Shooter Y" value={formatDistanceByUnits(shooter.y, units)} />
          <DebugRow
            label="Base Probability"
            value={`${(stats.baseMakeProbability * 100).toFixed(1)}%`}
          />
          <DebugRow
            label="Pressure Penalty"
            value={`-${(stats.pressurePenalty * 100).toFixed(1)} pts`}
          />
          <DebugRow
            label="Spacing Adjustment"
            value={`${stats.spacingAdjustment >= 0 ? "+" : ""}${(stats.spacingAdjustment * 100).toFixed(1)} pts`}
          />
          {stats.defenderDistances.map((defender) => (
            <DebugRow
              key={defender.id}
              label={`${defender.label} (${defender.point.x.toFixed(1)}, ${defender.point.y.toFixed(1)})`}
              value={formatDistanceByUnits(defender.distance, units)}
            />
          ))}
        </div>
      </details>
    </motion.aside>
  );
}

function getDisplayRecommendation(
  isLoading: boolean,
  prediction: ShotPredictionResponse | null,
  fallback: ShotRecommendation,
  quality: ShotQuality,
): ShotRecommendation {
  if (isLoading) {
    return {
      message: "Waiting for the backend to calculate the latest shot analytics.",
      title: "Calculating...",
      tone: "sky",
    };
  }

  if (!prediction) {
    return fallback;
  }

  return {
    message: prediction.recommendation,
    title: `${quality} shot recommendation`,
    tone: getRecommendationTone(quality),
  };
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

function getRecommendationTone(quality: ShotQuality): ShotRecommendation["tone"] {
  if (quality === "Excellent" || quality === "Good") {
    return "green";
  }

  if (quality === "Bad" || quality === "Poor") {
    return "red";
  }

  return "orange";
}

function getConfidenceTone(
  confidence: string | undefined,
): "green" | "orange" | "red" | "neutral" {
  if (confidence === "High") {
    return "green";
  }

  if (confidence === "Medium") {
    return "orange";
  }

  if (confidence === "Low") {
    return "red";
  }

  return "neutral";
}

function getPredictionSourceLabel(source: string | undefined) {
  if (source === "ml_model") {
    return "ML Model";
  }

  if (source === "rule_based_fallback") {
    return "Rule-Based Fallback";
  }

  if (!source) {
    return "Prediction Engine";
  }

  return "Prediction Engine";
}

function HeroMetric({
  icon,
  label,
  tone,
  value,
}: {
  icon: ReactNode;
  label: string;
  tone: "green" | "orange" | "red";
  value: string;
}) {
  return (
    <motion.div
      layout
      className={`rounded-lg border p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] ${toneClasses[tone]}`}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-75">
          {label}
        </p>
        <span className="grid size-10 place-items-center rounded-lg border border-current/20 bg-black/20">
          {icon}
        </span>
      </div>
      <motion.p
        key={value}
        initial={{ opacity: 0.72, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="mt-3 text-5xl font-black text-white"
      >
        {value}
      </motion.p>
    </motion.div>
  );
}

function StatTile({
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
    <motion.div
      layout
      className={`flex min-h-20 items-center gap-3 rounded-lg border p-3 shadow-[0_14px_38px_rgba(0,0,0,0.18)] ${toneClasses[tone]}`}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-current/20 bg-black/20">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-75">
          {label}
        </p>
        <motion.p
          key={value}
          initial={{ opacity: 0.72, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
          className="mt-1 truncate text-lg font-black text-white"
        >
          {value}
        </motion.p>
      </div>
    </motion.div>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
      <span className="min-w-0 truncate text-slate-400">{label}</span>
      <span className="shrink-0 font-black text-white">{value}</span>
    </div>
  );
}

const toneClasses = {
  green: "border-green-300/25 bg-green-400/10 text-green-100",
  neutral: "border-white/10 bg-black/30 text-slate-200",
  orange: "border-orange-300/25 bg-orange-500/10 text-orange-100",
  red: "border-red-300/25 bg-red-500/10 text-red-100",
};

const qualityTone: Record<ShotQuality, "green" | "orange" | "red" | "neutral"> =
  {
    Average: "orange",
    Bad: "red",
    Excellent: "green",
    Good: "green",
    Poor: "red",
  };

const pressureTone: Record<
  DefenderPressure,
  "green" | "orange" | "red" | "neutral"
> = {
  Moderate: "orange",
  Open: "orange",
  Tight: "red",
  "Very Open": "green",
  "Very Tight": "red",
};

const qualityBadge: Record<ShotQuality, string> = {
  Average: "border-yellow-300/30 bg-yellow-400/10 text-yellow-100",
  Bad: "border-red-300/35 bg-red-500/15 text-red-100",
  Excellent: "border-green-300/35 bg-green-400/15 text-green-100",
  Good: "border-emerald-300/35 bg-emerald-400/15 text-emerald-100",
  Poor: "border-orange-300/35 bg-orange-500/15 text-orange-100",
};

const eppsBarTone: Record<ShotQuality, string> = {
  Average: "bg-yellow-400",
  Bad: "bg-red-400",
  Excellent: "bg-green-400",
  Good: "bg-emerald-400",
  Poor: "bg-orange-400",
};
