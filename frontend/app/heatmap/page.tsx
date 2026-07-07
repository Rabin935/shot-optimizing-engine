import type { Metadata } from "next";
import { InteractiveHeatmapAnalytics } from "@/components/analytics/InteractiveHeatmapAnalytics";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  // Route metadata for the future heatmap workspace.
  title: "Heatmap | ShotOptix",
  description:
    "ShotOptix heatmap workspace for court zones and expected shot value.",
};

export default function HeatmapPage() {
  return (
    <AppShell>
      <InteractiveHeatmapAnalytics />
    </AppShell>
  );
}
