"use client";

import { BrainCircuit, Gauge, PieChart as PieIcon, Timer } from "lucide-react";
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
import { formatPercent } from "@/lib/analytics/formatters";
import {
  buildModelPerformance,
  replayHistoryToAnalyticsShots,
} from "@/lib/analytics/transforms";
import { useShotStore } from "@/store/useShotStore";
import type { ModelPerformanceDatum } from "@/types/charts";

const sourceColors = ["#86efac", "#fb923c", "#60a5fa", "#f87171"];

export function ModelPerformanceDashboard() {
  const replayHistory = useShotStore((state) => state.replayHistory);
  const shots = useMemo(
    () => replayHistoryToAnalyticsShots(replayHistory),
    [replayHistory],
  );
  const modelRows = useMemo(() => buildModelPerformance(shots), [shots]);
  const totalPredictions = modelRows.reduce((sum, row) => sum + row.count, 0);
  const mlPredictions = modelRows.find((row) => row.source === "ml_model")?.count ?? 0;
  const fallbackPredictions =
    modelRows.find((row) => row.source === "rule_based_fallback")?.count ?? 0;
  const averageConfidence = averageWeighted(
    modelRows.map((row) => [row.averageConfidence, row.count]),
  );

  return (
    <section className="grid gap-6">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">
          Model Performance
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
          Prediction source dashboard
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          Monitor how often ShotOptix uses the ML model, local prediction engine,
          or fallback path, plus confidence and response-time indicators.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<BrainCircuit className="size-5" />} label="Total Predictions" value={String(totalPredictions)} />
        <StatCard icon={<PieIcon className="size-5" />} label="ML Usage" value={formatPercent(rate(mlPredictions, totalPredictions))} tone="green" />
        <StatCard icon={<Timer className="size-5" />} label="Fallback Usage" value={formatPercent(rate(fallbackPredictions, totalPredictions))} tone="orange" />
        <StatCard icon={<Gauge className="size-5" />} label="Average Confidence" value={formatPercent(averageConfidence)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <AnalyticsCard
          action={<ExportChartButton data={modelRows} filename="shotoptix-model-source-usage" />}
          eyebrow="Pie Chart"
          title="Prediction source"
        >
          <ChartContainer empty={!modelRows.length}>
            <PieChart>
              <Pie data={modelRows} dataKey="count" innerRadius={64} nameKey="source" outerRadius={108} paddingAngle={3}>
                {modelRows.map((row, index) => (
                  <Cell key={row.source} fill={sourceColors[index % sourceColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<ModelTooltip />} />
            </PieChart>
          </ChartContainer>
        </AnalyticsCard>

        <AnalyticsCard
          action={<ExportChartButton data={modelRows} filename="shotoptix-model-confidence" />}
          eyebrow="Bar Chart"
          title="Average confidence"
        >
          <ChartContainer empty={!modelRows.length}>
            <BarChart data={modelRows} margin={{ bottom: 12, left: 0, right: 16, top: 16 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.09)" strokeDasharray="4 4" />
              <XAxis dataKey="source" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 800 }} tickLine={false} />
              <YAxis domain={[0, 1]} stroke="#94a3b8" tickFormatter={(value) => formatPercent(Number(value))} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }} tickLine={false} />
              <Tooltip content={<ModelTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="averageConfidence" name="Average Confidence" radius={[6, 6, 0, 0]}>
                {modelRows.map((row, index) => (
                  <Cell key={row.source} fill={sourceColors[index % sourceColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </AnalyticsCard>
      </div>
    </section>
  );
}

function ModelTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ModelPerformanceDatum }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-[#090909]/95 p-3 text-sm shadow-2xl">
      <p className="font-black text-white">{row.source}</p>
      <div className="mt-2 grid gap-1 text-xs font-bold text-slate-300">
        <span>Prediction Count: {row.count}</span>
        <span>Average Confidence: {formatPercent(row.averageConfidence)}</span>
        <span>Response Time: {row.responseTime}ms</span>
      </div>
    </div>
  );
}

function rate(value: number, total: number) {
  return total ? value / total : 0;
}

function averageWeighted(values: Array<[number, number]>) {
  const totalWeight = values.reduce((sum, [, weight]) => sum + weight, 0);

  if (!totalWeight) {
    return 0;
  }

  return values.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight;
}
