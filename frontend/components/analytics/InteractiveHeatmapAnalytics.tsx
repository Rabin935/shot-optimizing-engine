"use client";

import { Flame, Gauge, MapPin, Target } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { FilterBar, StatCard } from "@/components/charts";
import { formatDecimal, formatPercent } from "@/lib/analytics/formatters";
import {
  ANALYTICS_PRESSURE_ORDER,
  ANALYTICS_ZONE_ORDER,
  buildHeatmapRegions,
  replayHistoryToAnalyticsShots,
} from "@/lib/analytics/transforms";
import { useShotStore } from "@/store/useShotStore";
import type { AnalyticsPressureLevel, AnalyticsShotZone, HeatmapRegion } from "@/types/charts";

type HeatmapFilter = {
  eppsMin: number;
  probabilityMin: number;
  pressure: "all" | AnalyticsPressureLevel;
  zone: "all" | AnalyticsShotZone;
};

const defaultFilter: HeatmapFilter = {
  eppsMin: 0,
  pressure: "all",
  probabilityMin: 0,
  zone: "all",
};

export function InteractiveHeatmapAnalytics() {
  const replayHistory = useShotStore((state) => state.replayHistory);
  const shots = useMemo(
    () => replayHistoryToAnalyticsShots(replayHistory),
    [replayHistory],
  );
  const [filter, setFilter] = useState(defaultFilter);
  const allRegions = useMemo(() => buildHeatmapRegions(shots), [shots]);
  const regions = useMemo(
    () =>
      allRegions.filter(
        (region) =>
          (filter.zone === "all" || region.zone === filter.zone) &&
          (filter.pressure === "all" || region.pressure === filter.pressure) &&
          region.averageMakeProbability >= filter.probabilityMin &&
          region.averageEpps >= filter.eppsMin,
      ),
    [allRegions, filter],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRegion =
    regions.find((region) => region.id === selectedId) ?? pickHighestEpps(regions);
  const mostUsed = pickMostUsed(regions);
  const highestEpps = pickHighestEpps(regions);
  const lowestEpps = pickLowestEpps(regions);

  return (
    <section className="grid gap-6">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">
          Heatmap Analytics
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
          Shot density and value regions
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          Generate shot-density regions from simulation history, then filter by
          zone, pressure, make probability, or EPPS to inspect local strengths.
        </p>
      </header>

      <FilterBar title="Heatmap Filters">
        <SelectFilter label="Shot Zone" value={filter.zone} onChange={(value) => setFilter((current) => ({ ...current, zone: value as HeatmapFilter["zone"] }))}>
          <option value="all">All Zones</option>
          {ANALYTICS_ZONE_ORDER.map((zone) => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </SelectFilter>
        <SelectFilter label="Pressure" value={filter.pressure} onChange={(value) => setFilter((current) => ({ ...current, pressure: value as HeatmapFilter["pressure"] }))}>
          <option value="all">All Pressure</option>
          {ANALYTICS_PRESSURE_ORDER.map((pressure) => (
            <option key={pressure} value={pressure}>{pressure}</option>
          ))}
        </SelectFilter>
        <NumberFilter label="Make Probability" value={filter.probabilityMin} onChange={(value) => setFilter((current) => ({ ...current, probabilityMin: value }))} />
        <NumberFilter label="EPPS" value={filter.eppsMin} onChange={(value) => setFilter((current) => ({ ...current, eppsMin: value }))} step={0.05} />
      </FilterBar>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<MapPin className="size-5" />} label="Selected Region" value={selectedRegion?.label ?? "No region"} />
        <StatCard icon={<Target className="size-5" />} label="Attempts" value={String(selectedRegion?.attempts ?? 0)} />
        <StatCard icon={<Gauge className="size-5" />} label="Region EPPS" value={formatDecimal(selectedRegion?.averageEpps ?? 0)} tone="green" />
        <StatCard icon={<Flame className="size-5" />} label="Region Make" value={formatPercent(selectedRegion?.averageMakeProbability ?? 0)} tone="orange" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-white/10 bg-[#11180f] p-4">
          <div className="relative aspect-[50/47] min-h-[420px] overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_50%_12%,rgba(249,115,22,0.2),transparent_18%),linear-gradient(180deg,#172414,#10160f)]">
            <CourtLines />
            {regions.length ? (
              regions.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  aria-label={`Select ${region.label}`}
                  onClick={() => setSelectedId(region.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  style={{
                    background: getRegionColor(region),
                    height: `${Math.min(56, 18 + region.attempts * 8)}px`,
                    left: `${(region.x / 50) * 100}%`,
                    opacity: selectedRegion?.id === region.id ? 1 : 0.78,
                    top: `${(region.y / 47) * 100}%`,
                    width: `${Math.min(56, 18 + region.attempts * 8)}px`,
                  }}
                />
              ))
            ) : (
              <div className="absolute inset-0 grid place-items-center text-center text-sm font-bold text-slate-500">
                Save simulator replays or loosen filters to populate heatmap regions.
              </div>
            )}
          </div>
        </section>

        <aside className="grid gap-4">
          <RegionPanel title="Most used shooting location" region={mostUsed} />
          <RegionPanel title="Highest EPPS region" region={highestEpps} />
          <RegionPanel title="Lowest EPPS region" region={lowestEpps} />
        </aside>
      </div>
    </section>
  );
}

function SelectFilter({
  children,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-lg border border-white/10 bg-[#111] px-3 text-sm font-bold normal-case tracking-normal text-white"
      >
        {children}
      </select>
    </label>
  );
}

function NumberFilter({
  label,
  onChange,
  step = 0.01,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  return (
    <label className="grid gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
      {label}
      <input
        type="number"
        min={0}
        max={2}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-h-10 w-28 rounded-lg border border-white/10 bg-[#111] px-3 text-sm font-bold normal-case tracking-normal text-white"
      />
    </label>
  );
}

function RegionPanel({ region, title }: { region: HeatmapRegion | null; title: string }) {
  return (
    <section className="rounded-lg border border-white/10 bg-black/30 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <h2 className="mt-2 text-lg font-black text-white">{region?.label ?? "No region"}</h2>
      <div className="mt-3 grid gap-2 text-sm font-bold text-slate-300">
        <span>Zone: {region?.zone ?? "None"}</span>
        <span>Pressure: {region?.pressure ?? "None"}</span>
        <span>Attempts: {region?.attempts ?? 0}</span>
        <span>EPPS: {formatDecimal(region?.averageEpps ?? 0)}</span>
      </div>
    </section>
  );
}

function CourtLines() {
  // CSS-only court markings keep the heatmap lightweight and responsive.
  return (
    <>
      <div className="absolute left-1/2 top-[7%] h-[18%] w-[22%] -translate-x-1/2 rounded-b-full border border-white/15" />
      <div className="absolute left-1/2 top-[5%] size-5 -translate-x-1/2 rounded-full border border-orange-200/60" />
      <div className="absolute left-1/2 top-[12%] h-[34%] w-[34%] -translate-x-1/2 rounded-b-full border border-white/15" />
      <div className="absolute inset-x-[10%] top-[9%] h-[56%] rounded-b-[999px] border border-white/10 border-t-0" />
      <div className="absolute inset-x-0 top-1/2 border-t border-white/10" />
    </>
  );
}

function getRegionColor(region: HeatmapRegion) {
  if (region.averageEpps >= 1.15) {
    return "rgba(34,197,94,0.84)";
  }

  if (region.averageEpps >= 0.95) {
    return "rgba(251,146,60,0.84)";
  }

  return "rgba(248,113,113,0.84)";
}

function pickMostUsed(regions: HeatmapRegion[]) {
  return regions.reduce<HeatmapRegion | null>(
    (selected, region) => (!selected || region.attempts > selected.attempts ? region : selected),
    null,
  );
}

function pickHighestEpps(regions: HeatmapRegion[]) {
  return regions.reduce<HeatmapRegion | null>(
    (selected, region) =>
      !selected || region.averageEpps > selected.averageEpps ? region : selected,
    null,
  );
}

function pickLowestEpps(regions: HeatmapRegion[]) {
  return regions.reduce<HeatmapRegion | null>(
    (selected, region) =>
      !selected || region.averageEpps < selected.averageEpps ? region : selected,
    null,
  );
}
