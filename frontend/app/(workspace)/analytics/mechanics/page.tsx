import type { Metadata } from "next";
import { MechanicsAnalysisDashboard } from "@/components/analytics/MechanicsAnalysisDashboard";

export const metadata: Metadata = {
  title: "Mechanics Analytics | ShotOptix",
  description: "ShotOptix simulator mechanics analytics and improvement suggestions.",
};

export default function MechanicsAnalyticsPage() {
  // Keep the route static while the chart component reads client-side store data.
  return (
      <MechanicsAnalysisDashboard />
  );
}
