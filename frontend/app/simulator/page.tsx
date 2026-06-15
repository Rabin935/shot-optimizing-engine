import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = {
  // Route metadata for the future mechanics simulator workspace.
  title: "2D Simulator | ShotOptix",
  description:
    "ShotOptix 2D simulator workspace for body mechanics and defender contest experiments.",
};

export default function SimulatorPage() {
  // Render the shared roadmap placeholder until simulator controls are implemented.
  return (
    <AppShell>
      <ComingSoon
        title="2D Simulator"
        description="A mechanics simulator for studying release angle, body position, defender contest, and shot quality."
        phase="Phase 5 Preview"
        features={[
          "Pose controls",
          "Release angle inputs",
          "Defender contest state",
          "Mechanics scoring",
        ]}
      />
    </AppShell>
  );
}
