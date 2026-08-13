import type { ChartThemePreference } from "@/lib/settings-preferences";
import { useSettingsStore } from "@/store/useSettingsStore";

export type ChartPalette = {
  axis: string;
  grid: string;
  series1: string;
  series2: string;
  series3: string;
  series4: string;
  tooltipBg: string;
  panelBg: string;
};

const chartThemeOverrides: Record<
  ChartThemePreference,
  Partial<ChartPalette>
> = {
  arena: {},
  contrast: {
    series1: "#ff7a18",
    series2: "#4ade80",
    series3: "#38bdf8",
    series4: "#fde047",
  },
  print: {
    series1: "#d97706",
    series2: "#15803d",
    series3: "#475569",
    series4: "#a16207",
    axis: "#334155",
    grid: "rgba(51, 65, 85, 0.18)",
    tooltipBg: "#ffffff",
    panelBg: "#ffffff",
  },
};

function readCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.body).getPropertyValue(name).trim();
  return value || fallback;
}

export function getChartPalette(theme: ChartThemePreference): ChartPalette {
  const base: ChartPalette = {
    axis: readCssVar("--chart-axis", "#94a3b8"),
    grid: readCssVar("--chart-grid", "rgba(255,255,255,0.09)"),
    series1: readCssVar("--chart-series-1", "#fb923c"),
    series2: readCssVar("--chart-series-2", "#86efac"),
    series3: readCssVar("--chart-series-3", "#38bdf8"),
    series4: readCssVar("--chart-series-4", "#facc15"),
    tooltipBg: readCssVar("--chart-tooltip-bg", "rgba(9,9,9,0.95)"),
    panelBg: readCssVar("--chart-panel-bg", "rgba(0,0,0,0.25)"),
  };

  return { ...base, ...chartThemeOverrides[theme] };
}

export function useChartPalette(): ChartPalette {
  const chartTheme = useSettingsStore((state) => state.settings.chartTheme);
  return getChartPalette(chartTheme);
}
