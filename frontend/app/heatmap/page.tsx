import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = {
  // Route metadata for the future heatmap workspace.
  title: "Heatmap | ShotOptix",
  description:
    "ShotOptix heatmap workspace for court zones and expected shot value.",
};

export default function HeatmapPage() {
  // Render the shared roadmap placeholder until heatmaps are implemented.
  return (
    <AppShell>
      <ComingSoon
        title="Heatmap"
        description="A court visualization workspace for locating high-value zones and pressure-adjusted scoring areas."
        phase="Phase 5 Preview"
        features={[
          "Shot zone overlays",
          "EPPS color scale",
          "Pressure-adjusted maps",
          "Player filter controls",
        ]}
      />
    </AppShell>
  );
}
