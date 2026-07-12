import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { LazyAnalyticsReportsDashboard } from "@/components/performance/LazyWorkspaces";

export const metadata: Metadata = {
  title: "Reports | ShotOptix",
  description:
    "ShotOptix reports workspace for exporting model, EPPS, and shot analysis summaries.",
};

export default function ReportsPage() {
  return (
    <AppShell>
      <LazyAnalyticsReportsDashboard />
    </AppShell>
  );
}
