import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { LazyInteractiveHeatmapAnalytics } from "@/components/performance/LazyWorkspaces";

export const metadata: Metadata = {
  title: "Heatmap | ShotOptix",
  description:
    "ShotOptix heatmap workspace for court zones and expected shot value.",
};

export default function HeatmapPage() {
  return (
    <AppShell>
      <LazyInteractiveHeatmapAnalytics />
    </AppShell>
  );
}
