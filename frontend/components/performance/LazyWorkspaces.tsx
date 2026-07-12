"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";

function WorkspaceFallback() {
  return (
    <section className="grid gap-5" aria-label="Loading workspace">
      <Skeleton className="h-24" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-[460px]" />
    </section>
  );
}

export const LazyDashboardHome = dynamic(
  () =>
    import("@/components/dashboard/DashboardHome").then(
      (mod) => mod.DashboardHome,
    ),
  { loading: WorkspaceFallback, ssr: false },
);

export const LazyInteractiveHeatmapAnalytics = dynamic(
  () =>
    import("@/components/analytics/InteractiveHeatmapAnalytics").then(
      (mod) => mod.InteractiveHeatmapAnalytics,
    ),
  { loading: WorkspaceFallback, ssr: false },
);

export const LazyAnalyticsReportsDashboard = dynamic(
  () =>
    import("@/components/analytics/AnalyticsReportsDashboard").then(
      (mod) => mod.AnalyticsReportsDashboard,
    ),
  { loading: WorkspaceFallback, ssr: false },
);

export const LazySimulatorStateControls = dynamic(
  () =>
    import("@/components/simulator/SimulatorStateControls").then(
      (mod) => mod.SimulatorStateControls,
    ),
  { loading: WorkspaceFallback, ssr: false },
);
