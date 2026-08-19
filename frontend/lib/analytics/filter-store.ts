"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AnalyticsFilterState } from "@/types/charts";

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilterState = {
  dateFrom: "",
  dateTo: "",
  eppsMax: 3,
  eppsMin: 0,
  makeProbabilityMax: 1,
  makeProbabilityMin: 0,
  mechanicsScoreMax: 100,
  mechanicsScoreMin: 0,
  predictionSource: "all",
  pressureLevel: "all",
  searchQuery: "",
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
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<AnalyticsFilterStore> | undefined;

        return {
          ...current,
          filters: {
            ...DEFAULT_ANALYTICS_FILTERS,
            ...persistedState?.filters,
          },
        };
      },
      name: "shotoptix-analytics-filters",
      storage: createJSONStorage(() => localStorage),
      version: 2,
    },
  ),
);
