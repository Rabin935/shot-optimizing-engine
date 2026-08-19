import type { Metadata } from "next";
import { ShotZonePerformanceAnalytics } from "@/components/analytics/ShotZonePerformanceAnalytics";

export const metadata: Metadata = {
  title: "Shot Zone Analytics | ShotOptix",
  description: "ShotOptix zone performance charts for EPPS, probability, mechanics, and pressure.",
};

export default function ShotZoneAnalyticsPage() {
  // The page is server-rendered shell with client charts mounted inside it.
  return (
      <ShotZonePerformanceAnalytics />
  );
}
