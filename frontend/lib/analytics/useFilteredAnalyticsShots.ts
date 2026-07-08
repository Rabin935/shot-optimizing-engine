"use client";

import { useMemo } from "react";
import { useShotStore } from "@/store/useShotStore";
import {
  applyAnalyticsFilters,
  replayHistoryToAnalyticsShots,
} from "./transforms";
import { useAnalyticsFilterStore } from "./filter-store";

export function useFilteredAnalyticsShots() {
  const replayHistory = useShotStore((state) => state.replayHistory);
  const filters = useAnalyticsFilterStore((state) => state.filters);

  return useMemo(() => {
    const shots = replayHistoryToAnalyticsShots(replayHistory);

    return applyAnalyticsFilters(shots, filters);
  }, [filters, replayHistory]);
}

export function useAnalyticsSessions() {
  const replayHistory = useShotStore((state) => state.replayHistory);

  return useMemo(() => {
    const shots = replayHistoryToAnalyticsShots(replayHistory);

    return Array.from(new Set(shots.map((shot) => shot.sessionId))).sort();
  }, [replayHistory]);
}
