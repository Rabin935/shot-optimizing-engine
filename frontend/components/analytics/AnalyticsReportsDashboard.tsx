"use client";

import {
  Activity,
  Award,
  FileDown,
  Gauge,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
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

export function AnalyticsReportsDashboard() {
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

  return (
    <section className="grid gap-6">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">
          Analytics Dashboard
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
          ShotOptix performance command center
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          A full replay-powered reporting workspace for prediction trends, EPPS,
          mechanics, optimizer impact, pressure, shot zones, and recent sessions.
        </p>
      </header>

      <GlobalAnalyticsFilterBar />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Activity className="size-5" />} label="Replay Summary" value={`${summary.shotCount} shots`} />
        <StatCard icon={<Gauge className="size-5" />} label="Average EPPS" value={formatDecimal(summary.averageEpps)} tone="green" />
        <StatCard icon={<Target className="size-5" />} label="Average Make" value={formatPercent(summary.averageMakeProbability)} tone="orange" />
        <StatCard icon={<Award className="size-5" />} label="Best Shot" value={bestShot ? `#${bestShot.shotNumber}` : "No data"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <AnalyticsCard
          action={<ExportChartButton data={trendRows} filename="shotoptix-dashboard-trends" />}
          eyebrow="Prediction + EPPS"
          title="Simulation trend overview"
        >
          <ChartContainer empty={!trendRows.length} height={360}>
            <LineChart data={trendRows} margin={{ bottom: 12, left: 0, right: 16, top: 16 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.09)" strokeDasharray="4 4" />
              <XAxis dataKey="shotNumber" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }} tickLine={false} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }} tickLine={false} />
              <Tooltip content={<TrendTooltip />} />
              <Line type="monotone" dataKey="epps" name="EPPS" stroke="#86efac" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="makeProbability" name="Make Probability" stroke="#fb923c" strokeWidth={3} dot={false} />
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
              <CartesianGrid stroke="rgba(255,255,255,0.09)" strokeDasharray="4 4" />
              <XAxis dataKey="zone" interval={0} stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 800 }} tickLine={false} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }} tickLine={false} />
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
              <CartesianGrid stroke="rgba(255,255,255,0.09)" strokeDasharray="4 4" />
              <XAxis dataKey="pressure" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 800 }} tickLine={false} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }} tickLine={false} />
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
