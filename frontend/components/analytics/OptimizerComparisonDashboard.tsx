"use client";

import { ArrowUpRight, Gauge, Target, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnalyticsCard, ChartContainer, ExportChartButton, StatCard } from "@/components/charts";
import { formatDecimal, formatPercent, formatScore } from "@/lib/analytics/formatters";
import { buildOptimizerComparison } from "@/lib/analytics/transforms";
import { useChartPalette } from "@/lib/chart-theme";
import { calculateMechanicsScore } from "@/lib/simulator-analysis";
import { useShotStore, type DefenderPoseState } from "@/store/useShotStore";
import type { OptimizerComparisonDatum } from "@/types/charts";

export function OptimizerComparisonDashboard() {
  const palette = useChartPalette();
  const state = useShotStore((store) => store);
  const primaryDefenderPose =
    state.defenderPoses[state.defenders[0]?.id ?? "d1"] ??
    Object.values(state.defenderPoses)[0] ??
    DEFAULT_DEFENDER_POSE;
  const currentMechanics = useMemo(
    () =>
      calculateMechanicsScore({
        defenderPose: primaryDefenderPose,
        pressureLevel: state.pressureLevel,
        shooterPose: state.shooterPose,
      }).overallForm,
    [primaryDefenderPose, state.pressureLevel, state.shooterPose],
  );
  const comparisonRows = useMemo(
    () =>
      buildOptimizerComparison({
        currentMechanics,
        currentMetrics: state,
        optimizedShot: state.optimizedShot,
        shooterPose: state.shooterPose,
      }),
    [currentMechanics, state],
  );
  const eppsGain = getMetricGain(comparisonRows, "EPPS");
  const probabilityGain = getMetricGain(comparisonRows, "Make Probability");
  const mechanicsGain = getMetricGain(comparisonRows, "Mechanics Score");
  const recommendationSummary =
    state.optimizedShot?.title ??
    "Run the optimizer or load a recommendation to compare against the current shot.";

  return (
    <section className="grid gap-6">
      <header className="flex flex-col gap-3 border-b border-[color:var(--line)] pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-success">
          Optimizer Analytics
        </p>
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
          Current shot vs recommendation
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Compare the current possession against the optimizer’s recommended
          shot across EPPS, make probability, mechanics, pressure, and distance.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard icon={<TrendingUp className="size-5" />} label="EPPS Gain" value={formatSigned(eppsGain)} tone="green" />
        <StatCard icon={<Gauge className="size-5" />} label="Mechanics Improvement" value={formatSigned(mechanicsGain, 0)} tone="orange" />
        <StatCard icon={<Target className="size-5" />} label="Probability Improvement" value={formatSignedPercent(probabilityGain)} />
      </div>

      <AnalyticsCard
        action={<ExportChartButton data={comparisonRows} filename="shotoptix-optimizer-comparison" />}
        eyebrow="Grouped Bar Chart"
        title="Metric comparison"
      >
        <ChartContainer height={390}>
          <BarChart data={comparisonRows} margin={{ bottom: 12, left: 0, right: 16, top: 16 }}>
            <CartesianGrid stroke={palette.grid} strokeDasharray="4 4" />
            <XAxis dataKey="metric" interval={0} stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 11, fontWeight: 800 }} tickLine={false} />
            <YAxis stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 12, fontWeight: 700 }} tickLine={false} />
            <Tooltip content={<OptimizerTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Legend wrapperStyle={{ color: palette.axis, fontSize: 12, fontWeight: 800 }} />
            <Bar dataKey="current" fill={palette.series1} name="Current Shot" radius={[6, 6, 0, 0]} />
            <Bar dataKey="recommendation" fill={palette.series2} name="Optimizer Recommendation" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </AnalyticsCard>

      <div className="rounded-lg border border-green-300/20 bg-green-400/10 p-4">
        <div className="flex gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-green-300/25 bg-black/20 text-green-100">
            <ArrowUpRight className="size-5" />
          </span>
          <div>
            <p className="text-sm font-black text-green-100">Recommendation Summary</p>
            <p className="mt-1 text-sm leading-6 text-slate-200">
              {recommendationSummary}. EPPS changes by {formatSigned(eppsGain)}, make probability by{" "}
              {formatSignedPercent(probabilityGain)}, and mechanics by{" "}
              {formatSigned(mechanicsGain, 0)} points.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function OptimizerTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: OptimizerComparisonDatum }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-[#090909]/95 p-3 text-sm shadow-2xl">
      <p className="font-black text-white">{row.metric}</p>
      <div className="mt-2 grid gap-1 text-xs font-bold text-slate-300">
        <span>Current: {formatMetric(row.metric, row.current)}</span>
        <span>Recommendation: {formatMetric(row.metric, row.recommendation)}</span>
      </div>
    </div>
  );
}

function getMetricGain(rows: OptimizerComparisonDatum[], metric: string) {
  const row = rows.find((item) => item.metric === metric);

  return row ? row.recommendation - row.current : 0;
}

function formatMetric(metric: string, value: number) {
  if (metric === "Make Probability") {
    return formatPercent(value);
  }

  if (metric === "Mechanics Score") {
    return formatScore(value);
  }

  return formatDecimal(value);
}

function formatSigned(value: number, digits = 2) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function formatSignedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

const DEFAULT_DEFENDER_POSE: DefenderPoseState = {
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
