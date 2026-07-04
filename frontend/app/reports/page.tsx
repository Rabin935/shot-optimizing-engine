import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ResearchDashboard } from "@/components/reports/ResearchDashboard";

export const metadata: Metadata = {
  // Route metadata for the future reporting workspace.
  title: "Reports | ShotOptix",
  description:
    "ShotOptix reports workspace for exporting model, EPPS, and shot analysis summaries.",
};

export default function ReportsPage() {
  return (
    <AppShell>
      <ResearchDashboard />
    </AppShell>
  );
}
