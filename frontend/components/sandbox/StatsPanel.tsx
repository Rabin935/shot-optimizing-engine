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
  ShotQuality,
} from "@/lib/sandbox-metrics";

type StatsPanelProps = {
  shooter: CourtPoint;
  stats: SandboxStats;
};

export function StatsPanel({ shooter, stats }: StatsPanelProps) {
  const probability = stats.makeProbability * 100;
  const eppsMeter = Math.min((stats.expectedPoints / 1.45) * 100, 100);

  return (
    <motion.aside
      className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-5 lg:sticky lg:top-5 lg:self-start"
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08, duration: 0.42, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg border border-green-300/25 bg-green-400/10 text-green-100">
            <Gauge className="size-5" />
          </span>
          <div>
            <p className="text-sm font-black text-white">Live Shot Model</p>
            <p className="text-xs text-slate-400">Rule-based Phase 2 engine</p>
          </div>
        </div>
        <span className={`rounded-md border px-2.5 py-1 text-xs font-black ${qualityBadge[stats.shotQuality]}`}>
          {stats.shotQuality}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <HeroMetric
          icon={<Activity className="size-5" />}
          label="Make Probability"
          tone={probability >= 50 ? "green" : probability >= 38 ? "orange" : "red"}
          value={`${probability.toFixed(1)}%`}
        />
        <HeroMetric
          icon={<Target className="size-5" />}
          label="EPPS"
          tone={
            stats.expectedPoints >= 1.15
              ? "green"
              : stats.expectedPoints >= 0.9
                ? "orange"
                : "red"
          }
          value={stats.expectedPoints.toFixed(2)}
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
            className={`h-full rounded-full shadow-[0_0_18px_rgba(74,222,128,0.45)] ${eppsBarTone[stats.shotQuality]}`}
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
        <RecommendationCard recommendation={stats.recommendation} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <StatTile
          icon={<Target className="size-5" />}
          label="Shot Value"
          tone={stats.shotValue === 3 ? "green" : "neutral"}
          value={`${stats.shotValue} points`}
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
          value={`${stats.distanceToBasket.toFixed(1)} ft`}
        />
        <StatTile
          icon={<Shield className="size-5" />}
          label="Closest Defender"
          tone={stats.closestDefenderDistance <= 4 ? "red" : "neutral"}
          value={formatDistance(stats.closestDefenderDistance)}
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
          tone={qualityTone[stats.shotQuality]}
          value={stats.shotQuality}
        />
      </div>

      <details className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4 text-sm">
        <summary className="cursor-pointer select-none text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 outline-none transition hover:text-slate-200">
          Coordinates / Debug Info
        </summary>
        <div className="mt-4 grid gap-2">
          <DebugRow label="Shooter X" value={`${shooter.x.toFixed(2)} ft`} />
          <DebugRow label="Shooter Y" value={`${shooter.y.toFixed(2)} ft`} />
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
              value={`${defender.distance.toFixed(1)} ft`}
            />
          ))}
        </div>
      </details>
    </motion.aside>
  );
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

function formatDistance(distance: number) {
  if (!Number.isFinite(distance)) {
    return "No defender";
  }

  return `${distance.toFixed(1)} ft`;
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
