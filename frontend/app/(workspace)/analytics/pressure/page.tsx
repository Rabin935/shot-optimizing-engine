import type { Metadata } from "next";
import { DefenderPressureAnalytics } from "@/components/analytics/DefenderPressureAnalytics";

export const metadata: Metadata = {
  title: "Pressure Analytics | ShotOptix",
  description: "ShotOptix defender pressure distribution and EPPS analytics.",
};

export default function PressureAnalyticsPage() {
  // Keep route files server-side and isolate chart interactivity in the component.
  return (
      <DefenderPressureAnalytics />
  );
}
