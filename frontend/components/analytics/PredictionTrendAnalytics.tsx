"use client";

import { Activity, Gauge, Target, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnalyticsCard, ChartContainer, ExportChartButton, StatCard } from "@/components/charts";
import { GlobalAnalyticsFilterBar } from "@/components/analytics/GlobalAnalyticsFilterBar";
import { formatDecimal, formatPercent } from "@/lib/analytics/formatters";
import { buildTrendSeries } from "@/lib/analytics/transforms";
import { useFilteredAnalyticsShots } from "@/lib/analytics/useFilteredAnalyticsShots";
import type { TrendPoint, TrendWindow } from "@/types/charts";

const trendWindows: Array<{ label: string; value: TrendWindow }> = [
  { label: "Last 10", value: 10 },
  { label: "Last 25", value: 25 },
  { label: "Last 50", value: 50 },
  { label: "All", value: "all" },
];

export function PredictionTrendAnalytics() {
  const [windowSize, setWindowSize] = useState<TrendWindow>(10);
  const shots = useFilteredAnalyticsShots();
  const trendSeries = useMemo(
    () => buildTrendSeries(shots, windowSize),
    [shots, windowSize],
  );
  const summary = useMemo(() => summarizeTrendSeries(trendSeries), [trendSeries]);

  return (
    <section className="grid gap-6">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">
          Prediction Analytics
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
          EPPS and make probability trends
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          Track replay and simulation history over time to spot rising shot value,
          falling pressure tolerance, and repeatable scoring windows.
        </p>
      </header>

      <GlobalAnalyticsFilterBar />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Gauge className="size-5" />} label="Average EPPS" value={formatDecimal(summary.averageEpps)} tone="green" />
        <StatCard icon={<TrendingUp className="size-5" />} label="Highest EPPS" value={formatDecimal(summary.highestEpps)} tone="orange" />
        <StatCard icon={<Activity className="size-5" />} label="Lowest EPPS" value={formatDecimal(summary.lowestEpps)} />
        <StatCard icon={<Target className="size-5" />} label="Average Make" value={formatPercent(summary.averageMakeProbability)} tone="green" />
      </div>

      <div className="flex flex-wrap gap-2">
        {trendWindows.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setWindowSize(item.value)}
            className={`min-h-10 rounded-lg border px-4 text-sm font-black transition ${
              windowSize === item.value
                ? "border-orange-300/40 bg-orange-500/15 text-orange-100"
                : "border-white/10 bg-white/[0.05] text-slate-300 hover:border-white/20"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AnalyticsCard
          action={<ExportChartButton data={trendSeries} filename="shotoptix-make-probability-trend" />}
          eyebrow="Line Chart"
          title="Make Probability over simulations"
        >
          <TrendLineChart data={trendSeries} dataKey="makeProbability" domain={[0, 1]} tickFormatter={formatPercent} />
        </AnalyticsCard>

        <AnalyticsCard
          action={<ExportChartButton data={trendSeries} filename="shotoptix-epps-trend" />}
          eyebrow="Line Chart"
          title="EPPS over simulations"
        >
          <TrendLineChart data={trendSeries} dataKey="epps" domain={[0, "auto"]} tickFormatter={(value) => Number(value).toFixed(2)} />
        </AnalyticsCard>
      </div>
    </section>
  );
}

function TrendLineChart({
  data,
  dataKey,
  domain,
  tickFormatter,
}: {
  data: TrendPoint[];
  dataKey: "epps" | "makeProbability";
  domain: [number, number | "auto"];
  tickFormatter: (value: number) => string;
}) {
  return (
    <ChartContainer empty={!data.length}>
      <LineChart data={data} margin={{ bottom: 10, left: 0, right: 16, top: 16 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.09)" strokeDasharray="4 4" />
        <XAxis
          dataKey="shotNumber"
          stroke="#94a3b8"
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
        />
        <YAxis
          domain={domain}
          stroke="#94a3b8"
          tickFormatter={tickFormatter}
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
        />
        <Tooltip content={<TrendTooltip />} cursor={{ stroke: "#fb923c", strokeWidth: 1 }} />
        <Line
          type="monotone"
          dataKey={dataKey}
          dot={{ fill: "#fdba74", r: 4, stroke: "#111827", strokeWidth: 2 }}
          stroke={dataKey === "epps" ? "#86efac" : "#fdba74"}
          strokeWidth={3}
        />
      </LineChart>
    </ChartContainer>
  );
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TrendPoint }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-[#090909]/95 p-3 text-sm shadow-2xl">
      <p className="font-black text-white">Shot #{point.shotNumber}</p>
      <div className="mt-2 grid gap-1 text-xs font-bold text-slate-300">
        <span>Zone: {point.zone}</span>
        <span>EPPS: {formatDecimal(point.epps)}</span>
        <span>Probability: {formatPercent(point.makeProbability)}</span>
        <span>Pressure: {point.pressure}</span>
      </div>
    </div>
  );
}

function summarizeTrendSeries(trendSeries: TrendPoint[]) {
  // Summary cards should follow the selected trend window, not all history.
  if (!trendSeries.length) {
    return {
      averageEpps: 0,
      averageMakeProbability: 0,
      highestEpps: 0,
      lowestEpps: 0,
    };
  }

  const eppsValues = trendSeries.map((point) => point.epps);
  const probabilityValues = trendSeries.map((point) => point.makeProbability);

  return {
    averageEpps: average(eppsValues),
    averageMakeProbability: average(probabilityValues),
    highestEpps: Math.max(...eppsValues),
    lowestEpps: Math.min(...eppsValues),
  };
}

function average(values: number[]) {
  const validValues = values.filter(Number.isFinite);

  if (!validValues.length) {
    return 0;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}
