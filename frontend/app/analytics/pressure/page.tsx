import type { Metadata } from "next";
import { DefenderPressureAnalytics } from "@/components/analytics/DefenderPressureAnalytics";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Pressure Analytics | ShotOptix",
  description: "ShotOptix defender pressure distribution and EPPS analytics.",
};

export default function PressureAnalyticsPage() {
  // Keep route files server-side and isolate chart interactivity in the component.
  return (
    <AppShell>
      <DefenderPressureAnalytics />
    </AppShell>
  );
}
