"use client";

import { create } from "zustand";

type ChartInteractionStore = {
  activeChartId: string | null;
  activeDatumLabel: string | null;
  setActiveDatum: (chartId: string, label: string | null) => void;
};

export const useChartInteractionStore = create<ChartInteractionStore>((set) => ({
  activeChartId: null,
  activeDatumLabel: null,
  setActiveDatum: (chartId, label) =>
    set({
      activeChartId: label ? chartId : null,
      activeDatumLabel: label,
    }),
}));
