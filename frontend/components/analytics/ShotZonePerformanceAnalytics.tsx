"use client";

import { Award, BarChart3, Gauge, Target } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnalyticsCard, ChartContainer, ExportChartButton, StatCard } from "@/components/charts";
import { formatDecimal, formatPercent, formatScore } from "@/lib/analytics/formatters";
import {
  buildZonePerformance,
  replayHistoryToAnalyticsShots,
} from "@/lib/analytics/transforms";
import { useShotStore } from "@/store/useShotStore";
import type { ZonePerformanceDatum, ZoneSortMetric } from "@/types/charts";

const sortOptions: Array<{ label: string; value: ZoneSortMetric }> = [
  { label: "EPPS", value: "epps" },
  { label: "Probability", value: "probability" },
  { label: "Attempts", value: "attempts" },
];

export function ShotZonePerformanceAnalytics() {
  const replayHistory = useShotStore((state) => state.replayHistory);
  const [sortBy, setSortBy] = useState<ZoneSortMetric>("epps");
  const shots = useMemo(
    () => replayHistoryToAnalyticsShots(replayHistory),
    [replayHistory],
  );
  const zoneRows = useMemo(
    () => buildZonePerformance(shots, sortBy),
    [shots, sortBy],
  );
  const bestZone = zoneRows.find((row) => row.isBest);

  return (
    <section className="grid gap-6">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">
          Shot Zone Analytics
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
          Zone performance comparison
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          Compare Paint, Mid Range, Corner Three, Wing Three, and Top Three
          outcomes across EPPS, make probability, mechanics, and pressure.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Award className="size-5" />} label="Best Zone" value={bestZone?.zone ?? "No shots"} tone="green" />
        <StatCard icon={<Gauge className="size-5" />} label="Best EPPS" value={formatDecimal(bestZone?.averageEpps ?? 0)} />
        <StatCard icon={<Target className="size-5" />} label="Best Make" value={formatPercent(bestZone?.averageMakeProbability ?? 0)} tone="orange" />
        <StatCard icon={<BarChart3 className="size-5" />} label="Attempts" value={String(bestZone?.attempts ?? 0)} />
      </div>

      <AnalyticsCard
        action={<ExportChartButton data={zoneRows} filename="shotoptix-zone-performance" />}
        eyebrow="Bar Chart"
        title="Average zone performance"
        description="Sorting updates both the chart order and the best-zone highlight."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSortBy(option.value)}
              className={`min-h-10 rounded-lg border px-4 text-sm font-black transition ${
                sortBy === option.value
                  ? "border-green-300/35 bg-green-400/15 text-green-100"
                  : "border-white/10 bg-white/[0.05] text-slate-300 hover:border-white/20"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <ChartContainer empty={!shots.length} height={390}>
          <BarChart data={zoneRows} margin={{ bottom: 12, left: 0, right: 16, top: 16 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.09)" strokeDasharray="4 4" />
            <XAxis
              dataKey="zone"
              interval={0}
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 800 }}
              tickLine={false}
            />
            <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }} tickLine={false} />
            <Tooltip content={<ZoneTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12, fontWeight: 800 }} />
            <Bar dataKey="averageEpps" name="Avg EPPS" radius={[6, 6, 0, 0]}>
              {zoneRows.map((row) => (
                <Cell key={`epps-${row.zone}`} fill={row.isBest ? "#86efac" : "#fb923c"} />
              ))}
            </Bar>
            <Bar dataKey="averageMakeProbability" name="Avg Make" fill="#60a5fa" radius={[6, 6, 0, 0]} />
            <Bar dataKey="averageMechanicsScore" name="Mechanics / 100" fill="#c084fc" radius={[6, 6, 0, 0]} />
            <Bar dataKey="averagePressure" name="Pressure 1-5" fill="#f87171" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </AnalyticsCard>
    </section>
  );
}

function ZoneTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ZonePerformanceDatum }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-[#090909]/95 p-3 text-sm shadow-2xl">
      <p className="font-black text-white">
        {row.zone}
        {row.isBest ? " - Best" : ""}
      </p>
      <div className="mt-2 grid gap-1 text-xs font-bold text-slate-300">
        <span>Attempts: {row.attempts}</span>
        <span>EPPS: {formatDecimal(row.averageEpps)}</span>
        <span>Probability: {formatPercent(row.averageMakeProbability)}</span>
        <span>Mechanics: {formatScore(row.averageMechanicsScore)}</span>
        <span>Pressure: {formatDecimal(row.averagePressure, 1)} / 5</span>
      </div>
    </div>
  );
}
