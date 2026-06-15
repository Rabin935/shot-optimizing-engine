import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = {
  // Route metadata for the future shot optimizer workspace.
  title: "Optimizer | ShotOptix",
  description:
    "ShotOptix optimizer workspace for finding better shot decisions from court context.",
};

export default function OptimizerPage() {
  // Render the shared roadmap placeholder until optimization tools are implemented.
  return (
    <AppShell>
      <ComingSoon
        title="Optimizer"
        description="A decision workspace for comparing shot choices and identifying higher-value alternatives."
        phase="Phase 5 Preview"
        features={[
          "Best-shot suggestions",
          "Spacing recommendations",
          "Shot value comparison",
          "Scenario ranking",
        ]}
      />
    </AppShell>
  );
}
