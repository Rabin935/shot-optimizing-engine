import type { Metadata } from "next";
import { ModelPerformanceDashboard } from "@/components/analytics/ModelPerformanceDashboard";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  // Route metadata for the future model diagnostics workspace.
  title: "Model Info | ShotOptix",
  description:
    "ShotOptix model information workspace for Phase 4 ML diagnostics.",
};

export default function ModelInfoPage() {
  // Render model source analytics from saved prediction history.
  return (
    <AppShell>
      <ModelPerformanceDashboard />
    </AppShell>
  );
}
