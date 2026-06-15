import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = {
  // Route metadata for the future model diagnostics workspace.
  title: "Model Info | ShotOptix",
  description:
    "ShotOptix model information workspace for Phase 4 ML diagnostics.",
};

export default function ModelInfoPage() {
  // Render the shared roadmap placeholder until model diagnostics are implemented.
  return (
    <AppShell>
      <ComingSoon
        title="Model Info"
        description="A diagnostics page for explaining model status, metadata, features, and fallback readiness."
        phase="Phase 4 Diagnostics"
        features={[
          "Model loaded status",
          "Feature list display",
          "Training metadata summary",
          "Fallback status check",
        ]}
      />
    </AppShell>
  );
}
