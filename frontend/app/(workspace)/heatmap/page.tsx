import type { Metadata } from "next";
import { LazyInteractiveHeatmapAnalytics } from "@/components/performance/LazyWorkspaces";

export const metadata: Metadata = {
  title: "Heatmap | ShotOptix",
  description:
    "ShotOptix heatmap workspace for court zones and expected shot value.",
};

export default function HeatmapPage() {
  return (
      <LazyInteractiveHeatmapAnalytics />
  );
}
