import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = {
  // Route metadata for the future manual prediction workspace.
  title: "Prediction | ShotOptix",
  description:
    "ShotOptix prediction workspace for ML-backed shot probability exploration.",
};

export default function PredictionPage() {
  // Render the shared roadmap placeholder until manual prediction UI is implemented.
  return (
    <AppShell>
      <ComingSoon
        title="Prediction"
        description="A focused workspace for comparing shot context, ML probability, EPPS, and recommendation outputs."
        phase="Phase 4 Workspace"
        features={[
          "Manual shot context inputs",
          "ML probability comparison",
          "Rule fallback visibility",
          "Recommendation review",
        ]}
      />
    </AppShell>
  );
}
