"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BrainCircuit,
  Gauge,
  Medal,
  Ruler,
  Shield,
  Target,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";
import type {
  DefenderPressure,
  SandboxStats,
  ShotQuality,
} from "@/lib/sandbox-metrics";

type StatsPanelProps = {
  stats: SandboxStats;
};

export function StatsPanel({ stats }: StatsPanelProps) {
  const probability = stats.makeProbability * 100;
  const eppsMeter = Math.min((stats.expectedPoints / 1.55) * 100, 100);
  const insight = getShotInsight(stats);

  return (
    <motion.aside
      className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.32)] lg:sticky lg:top-5 lg:self-start"
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08, duration: 0.42, ease: "easeOut" }}
    >
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <span className="grid size-10 place-items-center rounded-lg border border-green-300/25 bg-green-400/10 text-green-100">
          <Gauge className="size-5" />
        </span>
        <div>
          <p className="text-sm font-black text-white">Live Shot Metrics</p>
          <p className="text-xs text-slate-400">Probability, EPPS, and space</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <StatCard
          icon={<Activity className="size-5" />}
          label="Make Probability"
          tone={probability >= 50 ? "green" : probability >= 38 ? "orange" : "red"}
          value={`${probability.toFixed(1)}%`}
        />
        <StatCard
          emphasized
          icon={<Target className="size-5" />}
          label="Expected Points (EPPS)"
          tone={
            stats.expectedPoints >= 1.15
              ? "green"
              : stats.expectedPoints >= 0.95
                ? "orange"
                : "red"
          }
          value={stats.expectedPoints.toFixed(2)}
        />

        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              EPPS Strength
            </p>
            <TrendingUp className="size-5 text-green-200" />
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-green-400 shadow-[0_0_18px_rgba(74,222,128,0.45)]"
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

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <StatCard
            icon={<Target className="size-5" />}
            label="Shot Type"
            tone={stats.shotType === "3PT" ? "green" : "neutral"}
            value={stats.shotType}
          />
          <StatCard
            icon={<Medal className="size-5" />}
            label="Shot Quality"
            tone={qualityTone[stats.shotQuality]}
            value={`${qualityEmoji[stats.shotQuality]} ${stats.shotQuality}`}
          />
          <StatCard
            icon={<Shield className="size-5" />}
            label="Defender Pressure"
            tone={pressureTone[stats.defenderPressure]}
            value={stats.defenderPressure}
          />
          <StatCard
            icon={<Ruler className="size-5" />}
            label="Distance"
            tone="neutral"
            value={`${stats.distanceToBasket.toFixed(1)} ft`}
          />
        </div>

        <div className="rounded-lg border border-sky-300/20 bg-sky-500/10 p-4 text-sky-100">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg border border-sky-200/20 bg-black/20">
              <BrainCircuit className="size-5" />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-80">
              Model Read
            </p>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-200">{insight}</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Defender Spacing
          </p>
          <div className="mt-3 grid gap-2">
            {stats.defenderDistances.map((defender) => (
              <div
                key={defender.id}
                className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2"
              >
                <span className="text-sm font-bold text-slate-200">
                  {defender.label}
                </span>
                <span className="text-sm font-black text-white">
                  {defender.distance.toFixed(1)} ft
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

function StatCard({
  emphasized = false,
  icon,
  label,
  tone,
  value,
}: {
  emphasized?: boolean;
  icon: ReactNode;
  label: string;
  tone: "green" | "orange" | "red" | "neutral";
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
        <span className="grid size-9 place-items-center rounded-lg border border-current/20 bg-black/20">
          {icon}
        </span>
      </div>
      <motion.p
        key={value}
        initial={{ opacity: 0.72, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className={`mt-3 font-black text-white ${
          emphasized ? "text-5xl" : "text-3xl"
        }`}
      >
        {value}
      </motion.p>
    </motion.div>
  );
}

const toneClasses = {
  green: "border-green-300/25 bg-green-400/10 text-green-100",
  orange: "border-orange-300/25 bg-orange-500/10 text-orange-100",
  red: "border-red-300/25 bg-red-500/10 text-red-100",
  neutral: "border-white/10 bg-black/30 text-slate-200",
};

const qualityTone: Record<ShotQuality, "green" | "orange" | "red" | "neutral"> =
  {
    Excellent: "green",
    Good: "green",
    Average: "orange",
    Poor: "red",
  };

const qualityEmoji: Record<ShotQuality, string> = {
  Excellent: "\u{1F525}",
  Good: "\u2705",
  Average: "\u2696\uFE0F",
  Poor: "\u26A0\uFE0F",
};

const pressureTone: Record<
  DefenderPressure,
  "green" | "orange" | "red" | "neutral"
> = {
  "Very Tight": "red",
  Tight: "red",
  Open: "orange",
  "Very Open": "green",
};

function getShotInsight(stats: SandboxStats) {
  if (stats.defenderPressure === "Very Tight") {
    return "The closeout is swallowing the release window. Create separation before trusting this look.";
  }

  if (stats.shotZone === "Mid-Range" && stats.expectedPoints < 0.95) {
    return "This is a lower-value pocket. Slide behind the arc or attack the paint to raise expected return.";
  }

  if (stats.shotZone === "Three Point" && stats.defenderPressure === "Very Open") {
    return "Clean three-point spacing. The expected value is strong enough to prioritize this attempt.";
  }

  if (stats.shotZone === "Paint") {
    return "High-value interior touch. Keep the angle and finish before the help defender closes.";
  }

  return "Balanced look. Small spacing gains or a cleaner release angle can still push the EPPS upward.";
}
