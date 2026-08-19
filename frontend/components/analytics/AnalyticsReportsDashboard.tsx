"use client";

import { useChartPalette } from '@/lib/chart-theme';
import {
  Activity,
  Award,
  FileDown,
  Gauge,
  Printer,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlobalAnalyticsFilterBar } from "@/components/analytics/GlobalAnalyticsFilterBar";
import { AnalyticsCard, ChartContainer, ExportChartButton, StatCard } from "@/components/charts";
import { EmptyState } from "@/components/ui";
import { formatDecimal, formatPercent, formatScore } from "@/lib/analytics/formatters";
import {
  buildHeatmapRegions,
  buildMechanicsAnalytics,
  buildPressureAnalytics,
  buildStatSummary,
  buildTrendSeries,
  buildZonePerformance,
  getBestByEpps,
  getBestPressure,
  getMostCommonPressure,
  getWorstByEpps,
  getWorstPressure,
} from "@/lib/analytics/transforms";
import { useFilteredAnalyticsShots } from "@/lib/analytics/useFilteredAnalyticsShots";
import { useShotStore } from "@/store/useShotStore";
import type {
  AnalyticsShot,
  MechanicsDatum,
  PressureDatum,
  TrendPoint,
  ZonePerformanceDatum,
} from "@/types/charts";

type ReportMode = "session" | "summary" | "trends" | "exports";

const reportModes: Array<{ label: string; value: ReportMode }> = [
  { label: "Session", value: "session" },
  { label: "Summary", value: "summary" },
  { label: "Trends", value: "trends" },
  { label: "Exports", value: "exports" },
];

export function AnalyticsReportsDashboard() {
  const palette = useChartPalette();
  const [reportMode, setReportMode] = useState<ReportMode>("session");
  const shots = useFilteredAnalyticsShots();
  const optimizedShot = useShotStore((state) => state.optimizedShot);
  const trendRows = useMemo(() => buildTrendSeries(shots, "all"), [shots]);
  const summary = useMemo(() => buildStatSummary(shots), [shots]);
  const zoneRows = useMemo(() => buildZonePerformance(shots, "epps"), [shots]);
  const pressureRows = useMemo(() => buildPressureAnalytics(shots), [shots]);
  const mechanicsRows = useMemo(() => buildMechanicsAnalytics(shots), [shots]);
  const heatmapRegions = useMemo(() => buildHeatmapRegions(shots), [shots]);
  const bestShot = getBestByEpps(shots);
  const worstShot = getWorstByEpps(shots);
  const bestZone = zoneRows.find((row) => row.isBest);
  const mostCommonPressure = getMostCommonPressure(pressureRows);
  const bestPressure = getBestPressure(pressureRows);
  const worstPressure = getWorstPressure(pressureRows);
  const recentShots = [...shots].slice(-6).reverse();
  const printReport = () => window.print();
  const trendAnalysis = useMemo(() => buildTrendAnalysis(trendRows), [trendRows]);
  const reportExport = useMemo(
    () => ({
      bestShot,
      heatmapRegions,
      mechanicsRows,
      optimizedShot,
      pressureRows,
      recentShots,
      summary,
      trendAnalysis,
      trendRows,
      worstShot,
      zoneRows,
    }),
    [
      bestShot,
      heatmapRegions,
      mechanicsRows,
      optimizedShot,
      pressureRows,
      recentShots,
      summary,
      trendAnalysis,
      trendRows,
      worstShot,
      zoneRows,
    ],
  );

  return (
    <section className="grid gap-6">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">
          Reports
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
          Report builder and analytics exports
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          Build thesis-ready session reports, multi-shot summaries, trend
          analysis, printable layouts, and exportable analytics snapshots.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Report view">
            {reportModes.map((mode) => (
              <button
                key={mode.value}
                type="button"
                role="tab"
                aria-selected={reportMode === mode.value}
                onClick={() => setReportMode(mode.value)}
                className={`min-h-10 rounded-lg border px-4 text-sm font-black transition ${
                  reportMode === mode.value
                    ? "border-orange-300/40 bg-orange-500/15 text-orange-100"
                    : "border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={printReport}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-slate-300 transition hover:border-green-300/35 hover:text-green-100"
            >
              <Printer className="size-4" />
              Print
            </button>
            <ExportChartButton data={reportExport} filename="shotoptix-full-report" />
          </div>
        </div>
      </header>

      <GlobalAnalyticsFilterBar />

      {!shots.length ? (
        <EmptyState title="No report data matches the current filters">
          Adjust the global analytics filters or save simulator replays to build
          a richer report.
        </EmptyState>
      ) : null}

      <section className="print-report grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Activity className="size-5" />} label="Replay Summary" value={`${summary.shotCount} shots`} />
        <StatCard icon={<Gauge className="size-5" />} label="Average EPPS" value={formatDecimal(summary.averageEpps)} tone="green" />
        <StatCard icon={<Target className="size-5" />} label="Average Make" value={formatPercent(summary.averageMakeProbability)} tone="orange" />
        <StatCard icon={<Award className="size-5" />} label="Best Shot" value={bestShot ? `#${bestShot.shotNumber}` : "No data"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <AnalyticsCard eyebrow="Multi-shot Summary" title="Session report snapshot">
          <div className="grid gap-3 md:grid-cols-2">
            <SummaryRow icon={<Target className="size-4" />} label="Shot sample" value={`${summary.shotCount} filtered attempts`} />
            <SummaryRow icon={<Award className="size-4" />} label="Best zone" value={bestZone?.zone ?? "No zone data"} />
            <SummaryRow icon={<Shield className="size-4" />} label="Pressure mode" value={mostCommonPressure?.pressure ?? "No pressure data"} />
            <SummaryRow icon={<Gauge className="size-4" />} label="Mechanics average" value={formatScore(average(mechanicsRows.map((row) => row.score)))} />
          </div>
        </AnalyticsCard>

        <AnalyticsCard eyebrow="Trend Analysis" title="Direction and consistency">
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryRow icon={<TrendingUp className="size-4" />} label="EPPS trend" value={trendAnalysis.eppsTrend} />
            <SummaryRow icon={<Target className="size-4" />} label="Make trend" value={trendAnalysis.makeTrend} />
            <SummaryRow icon={<Activity className="size-4" />} label="Consistency" value={trendAnalysis.consistency} />
          </div>
        </AnalyticsCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <AnalyticsCard
          action={<ExportChartButton data={trendRows} filename="shotoptix-dashboard-trends" />}
          eyebrow="Prediction + EPPS"
          title="Simulation trend overview"
        >
          <ChartContainer empty={!trendRows.length} height={360}>
            <LineChart data={trendRows} margin={{ bottom: 12, left: 0, right: 16, top: 16 }}>
              <CartesianGrid stroke={palette.grid} strokeDasharray="4 4" />
              <XAxis dataKey="shotNumber" stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 12, fontWeight: 700 }} tickLine={false} />
              <YAxis stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 12, fontWeight: 700 }} tickLine={false} />
              <Tooltip content={<TrendTooltip />} />
              <Line type="monotone" dataKey="epps" name="EPPS" stroke={palette.series2} strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="makeProbability" name="Make Probability" stroke={palette.series1} strokeWidth={3} dot={false} />
            </LineChart>
          </ChartContainer>
        </AnalyticsCard>

        <AnalyticsCard
          action={<ExportChartButton data={{ bestShot, worstShot, optimizedShot }} filename="shotoptix-dashboard-summary" />}
          eyebrow="Overview"
          title="Best, worst, latest recommendation"
        >
          <div className="grid gap-3">
            <SummaryRow icon={<TrendingUp className="size-4" />} label="Best Shot" value={describeShot(bestShot)} />
            <SummaryRow icon={<TrendingDown className="size-4" />} label="Worst Shot" value={describeShot(worstShot)} />
            <SummaryRow icon={<FileDown className="size-4" />} label="Latest Recommendation" value={optimizedShot?.title ?? "No optimizer recommendation loaded"} />
            <SummaryRow icon={<Shield className="size-4" />} label="Pressure Read" value={`${mostCommonPressure?.pressure ?? "No data"} common, ${bestPressure?.pressure ?? "No data"} best`} />
          </div>
        </AnalyticsCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AnalyticsCard
          action={<ExportChartButton data={zoneRows} filename="shotoptix-dashboard-zones" />}
          eyebrow="Shot Zones"
          title={`Best zone: ${bestZone?.zone ?? "No data"}`}
        >
          <ChartContainer empty={!shots.length}>
            <BarChart data={zoneRows} margin={{ bottom: 12, left: 0, right: 16, top: 16 }}>
              <CartesianGrid stroke={palette.grid} strokeDasharray="4 4" />
              <XAxis dataKey="zone" interval={0} stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 11, fontWeight: 800 }} tickLine={false} />
              <YAxis stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 12, fontWeight: 700 }} tickLine={false} />
              <Tooltip content={<ZoneTooltip />} />
              <Bar dataKey="averageEpps" name="Average EPPS" radius={[6, 6, 0, 0]}>
                {zoneRows.map((row) => (
                  <Cell key={row.zone} fill={row.isBest ? "#86efac" : "#fb923c"} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </AnalyticsCard>

        <AnalyticsCard
          action={<ExportChartButton data={pressureRows} filename="shotoptix-dashboard-pressure" />}
          eyebrow="Pressure"
          title={`Best pressure: ${bestPressure?.pressure ?? "No data"}`}
          description={`Worst pressure: ${worstPressure?.pressure ?? "No data"}`}
        >
          <ChartContainer empty={!shots.length}>
            <BarChart data={pressureRows} margin={{ bottom: 12, left: 0, right: 16, top: 16 }}>
              <CartesianGrid stroke={palette.grid} strokeDasharray="4 4" />
              <XAxis dataKey="pressure" stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 11, fontWeight: 800 }} tickLine={false} />
              <YAxis stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 12, fontWeight: 700 }} tickLine={false} />
              <Tooltip content={<PressureTooltip />} />
              <Bar dataKey="averageEpps" name="Average EPPS" fill="#60a5fa" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </AnalyticsCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <AnalyticsCard
          action={<ExportChartButton data={mechanicsRows} filename="shotoptix-dashboard-mechanics" />}
          eyebrow="Mechanics"
          title="Simulator mechanics score"
        >
          <div className="grid gap-2">
            {mechanicsRows.map((row) => (
              <MechanicsBar key={row.metric} row={row} />
            ))}
          </div>
        </AnalyticsCard>

        <AnalyticsCard
          action={<ExportChartButton data={heatmapRegions} filename="shotoptix-dashboard-heatmap" />}
          eyebrow="Heatmap"
          title="Shot density regions"
        >
          <div className="relative aspect-[50/30] min-h-72 overflow-hidden rounded-lg border border-white/10 bg-[#11180f]">
            {heatmapRegions.length ? (
              heatmapRegions.map((region) => (
                <span
                  key={region.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-orange-300/80"
                  style={{
                    height: `${Math.min(48, 16 + region.attempts * 7)}px`,
                    left: `${(region.x / 50) * 100}%`,
                    top: `${(region.y / 47) * 100}%`,
                    width: `${Math.min(48, 16 + region.attempts * 7)}px`,
                  }}
                  title={`${region.label}: ${formatDecimal(region.averageEpps)} EPPS`}
                />
              ))
            ) : (
              <div className="absolute inset-0 grid place-items-center text-sm font-bold text-slate-500">
                No heatmap regions match the current filters.
              </div>
            )}
          </div>
        </AnalyticsCard>
      </section>

      <AnalyticsCard
        action={<ExportChartButton data={recentShots} filename="shotoptix-recent-simulations" />}
        eyebrow="Replay Summary"
        title="Recent simulations"
      >
        <div className="grid gap-2">
          {recentShots.length ? (
            recentShots.map((shot) => <RecentShotRow key={shot.id} shot={shot} />)
          ) : (
            <p className="rounded-lg border border-white/10 bg-black/30 p-4 text-sm font-bold text-slate-500">
              Save simulator replays to populate recent simulations.
            </p>
          )}
        </div>
      </AnalyticsCard>
    </section>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {icon}
        {label}
      </span>
      <span className="text-right text-sm font-black text-white">{value}</span>
    </div>
  );
}

function MechanicsBar({ row }: { row: MechanicsDatum }) {
  return (
    <div className="grid gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="flex justify-between text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        <span>{row.metric}</span>
        <span>{formatScore(row.score)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-green-300" style={{ width: `${Math.min(row.score, 100)}%` }} />
      </div>
    </div>
  );
}

function RecentShotRow({ shot }: { shot: AnalyticsShot }) {
  return (
    <div className="grid gap-2 rounded-lg border border-white/10 bg-black/30 p-3 md:grid-cols-[90px_1fr_repeat(4,minmax(100px,auto))] md:items-center">
      <span className="text-sm font-black text-white">Shot #{shot.shotNumber}</span>
      <span className="text-sm font-bold text-slate-300">{shot.zone}</span>
      <span className="text-sm font-bold text-slate-300">{shot.pressure}</span>
      <span className="text-sm font-black text-green-200">{formatDecimal(shot.epps)} EPPS</span>
      <span className="text-sm font-black text-orange-100">{formatPercent(shot.makeProbability)}</span>
      <span className="text-sm font-black text-white">{formatScore(shot.mechanicsScore)}</span>
    </div>
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
      <p className="mt-1 text-xs font-bold text-slate-300">
        {formatDecimal(point.epps)} EPPS / {formatPercent(point.makeProbability)}
      </p>
    </div>
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
      <p className="font-black text-white">{row.zone}</p>
      <p className="mt-1 text-xs font-bold text-slate-300">
        {formatDecimal(row.averageEpps)} EPPS across {row.attempts} attempts
      </p>
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
      <p className="mt-1 text-xs font-bold text-slate-300">
        {formatDecimal(row.averageEpps)} EPPS from {row.count} attempts
      </p>
    </div>
  );
}

function describeShot(shot: AnalyticsShot | null) {
  if (!shot) {
    return "No replay data";
  }

  return `#${shot.shotNumber} ${shot.zone}, ${formatDecimal(shot.epps)} EPPS`;
}

function buildTrendAnalysis(rows: TrendPoint[]) {
  if (rows.length < 2) {
    return {
      consistency: "Needs more shots",
      eppsTrend: "No trend",
      makeTrend: "No trend",
    };
  }

  const first = rows[0];
  const last = rows[rows.length - 1];
  const eppsDelta = last.epps - first.epps;
  const makeDelta = last.makeProbability - first.makeProbability;
  const eppsValues = rows.map((row) => row.epps);
  const spread = Math.max(...eppsValues) - Math.min(...eppsValues);

  return {
    consistency:
      spread < 0.16 ? "Stable" : spread < 0.32 ? "Variable" : "Volatile",
    eppsTrend: formatTrend(eppsDelta, " EPPS"),
    makeTrend: formatTrend(makeDelta * 100, "%"),
  };
}

function formatTrend(value: number, suffix: string) {
  const sign = value >= 0 ? "+" : "";

  return `${sign}${value.toFixed(suffix === "%" ? 1 : 2)}${suffix}`;
}

function average(values: number[]) {
  const validValues = values.filter(Number.isFinite);

  if (!validValues.length) {
    return 0;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}
