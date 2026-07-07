import type { Metadata } from "next";
import { AnalyticsReportsDashboard } from "@/components/analytics/AnalyticsReportsDashboard";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Dashboard | ShotOptix",
  description: "ShotOptix comprehensive sports analytics dashboard.",
};

export default function DashboardPage() {
  // Dashboard is the primary analytics workspace for saved simulation history.
  return (
    <AppShell>
      <AnalyticsReportsDashboard />
    </AppShell>
  );
}
