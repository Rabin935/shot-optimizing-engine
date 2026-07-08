import type { Metadata } from "next";
import { InteractiveHeatmapAnalytics } from "@/components/analytics/InteractiveHeatmapAnalytics";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
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
