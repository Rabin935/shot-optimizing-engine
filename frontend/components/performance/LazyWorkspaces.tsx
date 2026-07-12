"use client";

import dynamic from "next/dynamic";
import { WorkspaceLoading } from "@/components/layout/WorkspaceLoading";

export const LazyDashboardHome = dynamic(
  () =>
    import("@/components/dashboard/DashboardHome").then(
      (mod) => mod.DashboardHome,
    ),
  { loading: WorkspaceLoading, ssr: false },
);

export const LazyInteractiveHeatmapAnalytics = dynamic(
  () =>
    import("@/components/analytics/InteractiveHeatmapAnalytics").then(
      (mod) => mod.InteractiveHeatmapAnalytics,
    ),
  { loading: WorkspaceLoading, ssr: false },
);

export const LazyAnalyticsReportsDashboard = dynamic(
  () =>
    import("@/components/analytics/AnalyticsReportsDashboard").then(
      (mod) => mod.AnalyticsReportsDashboard,
    ),
  { loading: WorkspaceLoading, ssr: false },
);

export const LazySimulatorStateControls = dynamic(
  () =>
    import("@/components/simulator/SimulatorStateControls").then(
      (mod) => mod.SimulatorStateControls,
    ),
  { loading: WorkspaceLoading, ssr: false },
);
