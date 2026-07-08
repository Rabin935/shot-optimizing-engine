"use client";

import { RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { FilterBar } from "@/components/charts";
import { Button, Dropdown, FieldLabel, Input } from "@/components/ui";
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
      <Button
        type="button"
        onClick={resetFilters}
        variant="outline"
      >
        <RotateCcw className="size-4" />
        Reset
      </Button>
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
    <FieldLabel className="grid gap-1 text-slate-500">
      {label}
      <Dropdown
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="normal-case tracking-normal"
      >
        {children}
      </Dropdown>
    </FieldLabel>
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
    <FieldLabel className="grid gap-1 text-slate-500">
      {label}
      <Input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-24 normal-case tracking-normal"
      />
    </FieldLabel>
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
    <FieldLabel className="grid gap-1 text-slate-500">
      {label}
      <Input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="normal-case tracking-normal"
      />
    </FieldLabel>
  );
}
