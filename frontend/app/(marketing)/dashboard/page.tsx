import type { Metadata } from "next";
import { AnalyticsReportsDashboard } from "@/components/analytics/AnalyticsReportsDashboard";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  // Route metadata for the dashboard workspace.
  title: "Dashboard | ShotOptix",
  description:
    "ShotOptix analytics dashboard for datasets, model status, and EPPS insights.",
};

export default function DashboardPage() {
  // Dashboard is the primary analytics workspace for saved simulation history.
  return (
    <AppShell>
      <AnalyticsReportsDashboard />
    </AppShell>
  );
}
