import {
  Activity,
  Gauge,
  Medal,
  Ruler,
  Shield,
  Target,
} from "lucide-react";
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

  return (
    <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
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
      </div>
    </aside>
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
  icon: React.ReactNode;
  label: string;
  tone: "green" | "orange" | "red" | "neutral";
  value: string;
}) {
  return (
    <div
      className={`rounded-lg border p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] ${toneClasses[tone]}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-75">
          {label}
        </p>
        <span className="grid size-9 place-items-center rounded-lg border border-current/20 bg-black/20">
          {icon}
        </span>
      </div>
      <p
        className={`mt-3 font-black text-white ${
          emphasized ? "text-5xl" : "text-3xl"
        }`}
      >
        {value}
      </p>
    </div>
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
  Excellent: "🔥",
  Good: "✅",
  Average: "⚖️",
  Poor: "⚠️",
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
