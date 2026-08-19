"use client";

import { useChartPalette } from '@/lib/chart-theme';
import { Shield, Target, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnalyticsCard, ChartContainer, ExportChartButton, StatCard } from "@/components/charts";
import { GlobalAnalyticsFilterBar } from "@/components/analytics/GlobalAnalyticsFilterBar";
import { formatDecimal } from "@/lib/analytics/formatters";
import {
  buildPressureAnalytics,
  getBestPressure,
  getMostCommonPressure,
  getWorstPressure,
} from "@/lib/analytics/transforms";
import { useFilteredAnalyticsShots } from "@/lib/analytics/useFilteredAnalyticsShots";
import type { PressureDatum } from "@/types/charts";

const pressureColors = ["#86efac", "#60a5fa", "#facc15", "#fb923c", "#f87171"];

export function DefenderPressureAnalytics() {
  const palette = useChartPalette();
  const shots = useFilteredAnalyticsShots();
  const pressureRows = useMemo(() => buildPressureAnalytics(shots), [shots]);
  const mostCommon = getMostCommonPressure(pressureRows);
  const bestPressure = getBestPressure(pressureRows);
  const worstPressure = getWorstPressure(pressureRows);

  return (
    <section className="grid gap-6">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">
          Defender Pressure
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
          Pressure distribution and EPPS
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          Measure how often each contest level appears and how shot value changes
          as defenders move from very open space to very tight contests.
        </p>
      </header>

      <GlobalAnalyticsFilterBar />

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard icon={<Shield className="size-5" />} label="Most Common" value={mostCommon?.pressure ?? "No data"} />
        <StatCard icon={<TrendingUp className="size-5" />} label="Best Pressure" value={bestPressure?.pressure ?? "No data"} tone="green" />
        <StatCard icon={<TrendingDown className="size-5" />} label="Worst Pressure" value={worstPressure?.pressure ?? "No data"} tone="red" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <AnalyticsCard
          action={<ExportChartButton data={pressureRows} filename="shotoptix-pressure-distribution" />}
          eyebrow="Pie Chart"
          title="Pressure distribution"
        >
          <ChartContainer empty={!shots.length}>
            <PieChart>
              <Pie
                data={pressureRows}
                dataKey="count"
                innerRadius={64}
                nameKey="pressure"
                outerRadius={108}
                paddingAngle={3}
              >
                {pressureRows.map((row, index) => (
                  <Cell key={row.pressure} fill={pressureColors[index]} />
                ))}
              </Pie>
              <Tooltip content={<PressureTooltip />} />
            </PieChart>
          </ChartContainer>
        </AnalyticsCard>

        <AnalyticsCard
          action={<ExportChartButton data={pressureRows} filename="shotoptix-pressure-epps" />}
          eyebrow="Bar Chart"
          title="Average EPPS under pressure"
        >
          <ChartContainer empty={!shots.length}>
            <BarChart data={pressureRows} margin={{ bottom: 12, left: 0, right: 16, top: 16 }}>
              <CartesianGrid stroke={palette.grid} strokeDasharray="4 4" />
              <XAxis dataKey="pressure" stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 11, fontWeight: 800 }} tickLine={false} />
              <YAxis stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 12, fontWeight: 700 }} tickLine={false} />
              <Tooltip content={<PressureTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="averageEpps" name="Average EPPS" radius={[6, 6, 0, 0]}>
                {pressureRows.map((row, index) => (
                  <Cell key={row.pressure} fill={pressureColors[index]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </AnalyticsCard>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <PressureInsight icon={<Target className="size-4" />} label="Most common pressure" value={mostCommon?.pressure ?? "No pressure samples"} />
        <PressureInsight icon={<TrendingUp className="size-4" />} label="Best pressure for shooter" value={`${bestPressure?.pressure ?? "No data"} (${formatDecimal(bestPressure?.averageEpps ?? 0)} EPPS)`} />
        <PressureInsight icon={<TrendingDown className="size-4" />} label="Worst pressure for shooter" value={`${worstPressure?.pressure ?? "No data"} (${formatDecimal(worstPressure?.averageEpps ?? 0)} EPPS)`} />
      </div>
    </section>
  );
}

function PressureInsight({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-4 py-3">
      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {icon}
        {label}
      </span>
      <span className="text-right text-sm font-black text-white">{value}</span>
    </div>
  );
}

function PressureTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PressureDatum }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-[#090909]/95 p-3 text-sm shadow-2xl">
      <p className="font-black text-white">{row.pressure}</p>
      <div className="mt-2 grid gap-1 text-xs font-bold text-slate-300">
        <span>Attempts: {row.count}</span>
        <span>Average EPPS: {formatDecimal(row.averageEpps)}</span>
      </div>
    </div>
  );
}
