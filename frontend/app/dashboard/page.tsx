import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { LazyDashboardHome } from "@/components/performance/LazyWorkspaces";

export const metadata: Metadata = {
  // Route metadata keeps the product dashboard discoverable in browser tabs.
  title: "Dashboard | ShotOptix",
  description:
    "ShotOptix control center for sessions, simulations, optimizer results, reports, and model status.",
};

export default function DashboardPage() {
  // The dashboard route is the app's operational home page.
  return (
    <AppShell>
      <LazyDashboardHome />
    </AppShell>
  );
}
