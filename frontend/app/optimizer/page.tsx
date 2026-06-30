import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { AdvancedEppsOptimizer } from "@/components/optimizer/AdvancedEppsOptimizer";

export const metadata: Metadata = {
  // Route metadata for the future shot optimizer workspace.
  title: "Optimizer | ShotOptix",
  description:
    "ShotOptix optimizer workspace for finding better shot decisions from court context.",
};

export default function OptimizerPage() {
  // Render the Phase 5 optimizer workspace driven by the shared shot store.
  return (
    <AppShell>
      <AdvancedEppsOptimizer />
    </AppShell>
  );
}
