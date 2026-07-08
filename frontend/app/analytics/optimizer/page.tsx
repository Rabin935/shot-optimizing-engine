import type { Metadata } from "next";
import { OptimizerComparisonDashboard } from "@/components/analytics/OptimizerComparisonDashboard";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Optimizer Analytics | ShotOptix",
  description: "ShotOptix current-shot versus optimizer recommendation comparison.",
};

export default function OptimizerAnalyticsPage() {
  // The comparison view reads the persisted optimizer handoff from the client store.
  return (
    <AppShell>
      <OptimizerComparisonDashboard />
    </AppShell>
  );
}
