import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "About | ShotOptix",
  description:
    "About the ShotOptix shot optimization engine and project roadmap.",
};

export default function AboutPage() {
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
