import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = {
  // Route metadata for the future project overview page.
  title: "About | ShotOptix",
  description:
    "About the ShotOptix shot optimization engine and project roadmap.",
};

export default function AboutPage() {
  // Render the shared roadmap placeholder until this section is implemented.
  return (
    <AppShell>
      <ComingSoon
        title="About"
        description="A project overview page for the ShotOptix goal, current ML phase, and thesis roadmap."
        phase="Project Notes"
        features={[
          "Project motivation",
          "Phase roadmap",
          "Technology stack",
          "Research explanation",
        ]}
      />
    </AppShell>
  );
}
