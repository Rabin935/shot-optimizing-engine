"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AnalyticsFilterState } from "@/types/charts";

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilterState = {
  dateFrom: "",
  dateTo: "",
  mechanicsScoreMax: 100,
  mechanicsScoreMin: 0,
  predictionSource: "all",
  pressureLevel: "all",
  sessionId: "",
  shotValue: "all",
  shotZone: "all",
};

type AnalyticsFilterStore = {
  filters: AnalyticsFilterState;
  resetFilters: () => void;
  updateFilters: (filters: Partial<AnalyticsFilterState>) => void;
};

export const useAnalyticsFilterStore = create<AnalyticsFilterStore>()(
  persist(
    (set) => ({
      filters: DEFAULT_ANALYTICS_FILTERS,
      resetFilters: () => set({ filters: DEFAULT_ANALYTICS_FILTERS }),
      updateFilters: (filters) =>
        set((state) => ({
          // Patch only changed filter fields so all analytics pages stay in sync.
          filters: {
            ...state.filters,
            ...filters,
          },
        })),
    }),
    {
      name: "shotoptix-analytics-filters",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
