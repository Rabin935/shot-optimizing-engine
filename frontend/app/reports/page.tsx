import type { Metadata } from "next";
import { AnalyticsReportsDashboard } from "@/components/analytics/AnalyticsReportsDashboard";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Reports | ShotOptix",
  description:
    "ShotOptix reports workspace for exporting model, EPPS, and shot analysis summaries.",
};

export default function ReportsPage() {
  return (
    <AppShell>
      <AnalyticsReportsDashboard />
    </AppShell>
  );
}
