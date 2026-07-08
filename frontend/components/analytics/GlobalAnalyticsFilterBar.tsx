"use client";

import { RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { FilterBar } from "@/components/charts";
import { ANALYTICS_PRESSURE_ORDER, ANALYTICS_ZONE_ORDER } from "@/lib/analytics/transforms";
import { useAnalyticsFilterStore } from "@/lib/analytics/filter-store";
import { useAnalyticsSessions } from "@/lib/analytics/useFilteredAnalyticsShots";
import type { AnalyticsFilterState } from "@/types/charts";

const predictionSources: Array<AnalyticsFilterState["predictionSource"]> = [
  "all",
  "ml_model",
  "prediction_engine",
  "rule_based_fallback",
  "local_estimate",
];

export function GlobalAnalyticsFilterBar() {
  const filters = useAnalyticsFilterStore((state) => state.filters);
  const updateFilters = useAnalyticsFilterStore((state) => state.updateFilters);
  const resetFilters = useAnalyticsFilterStore((state) => state.resetFilters);
  const sessions = useAnalyticsSessions();

  return (
    <FilterBar title="Global Analytics Filters">
      <SelectControl label="Zone" value={filters.shotZone} onChange={(value) => updateFilters({ shotZone: value as AnalyticsFilterState["shotZone"] })}>
        <option value="all">All Zones</option>
        {ANALYTICS_ZONE_ORDER.map((zone) => (
          <option key={zone} value={zone}>{zone}</option>
        ))}
      </SelectControl>
      <SelectControl label="Pressure" value={filters.pressureLevel} onChange={(value) => updateFilters({ pressureLevel: value as AnalyticsFilterState["pressureLevel"] })}>
        <option value="all">All Pressure</option>
        {ANALYTICS_PRESSURE_ORDER.map((pressure) => (
          <option key={pressure} value={pressure}>{pressure}</option>
        ))}
      </SelectControl>
      <SelectControl label="Shot Value" value={filters.shotValue} onChange={(value) => updateFilters({ shotValue: value as AnalyticsFilterState["shotValue"] })}>
        <option value="all">All Values</option>
        <option value="2">2 Points</option>
        <option value="3">3 Points</option>
      </SelectControl>
      <SelectControl label="Source" value={filters.predictionSource} onChange={(value) => updateFilters({ predictionSource: value as AnalyticsFilterState["predictionSource"] })}>
        {predictionSources.map((source) => (
          <option key={source} value={source}>{source === "all" ? "All Sources" : source}</option>
        ))}
      </SelectControl>
      <SelectControl label="Session" value={filters.sessionId} onChange={(value) => updateFilters({ sessionId: value })}>
        <option value="">All Sessions</option>
        {sessions.map((session) => (
          <option key={session} value={session}>{session}</option>
        ))}
      </SelectControl>
      <NumberControl label="Mech Min" value={filters.mechanicsScoreMin} onChange={(value) => updateFilters({ mechanicsScoreMin: value })} />
      <NumberControl label="Mech Max" value={filters.mechanicsScoreMax} onChange={(value) => updateFilters({ mechanicsScoreMax: value })} />
      <DateControl label="From" value={filters.dateFrom} onChange={(value) => updateFilters({ dateFrom: value })} />
      <DateControl label="To" value={filters.dateTo} onChange={(value) => updateFilters({ dateTo: value })} />
      <button
        type="button"
        onClick={resetFilters}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm font-black text-slate-100 transition hover:border-orange-300/35 hover:bg-orange-500/15"
      >
        <RotateCcw className="size-4" />
        Reset
      </button>
    </FilterBar>
  );
}

function SelectControl({
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

function NumberControl({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="grid gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
      {label}
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-h-10 w-24 rounded-lg border border-white/10 bg-[#111] px-3 text-sm font-bold normal-case tracking-normal text-white"
      />
    </label>
  );
}

function DateControl({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
      {label}
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-lg border border-white/10 bg-[#111] px-3 text-sm font-bold normal-case tracking-normal text-white"
      />
    </label>
  );
}
