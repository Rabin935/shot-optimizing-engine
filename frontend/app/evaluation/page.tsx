import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PredictionTrendAnalytics } from "@/components/analytics/PredictionTrendAnalytics";

export const metadata: Metadata = {
  // Route metadata for the future model evaluation workspace.
  title: "Evaluation | ShotOptix",
  description:
    "ShotOptix evaluation workspace for model metrics and prediction quality.",
};

export default function EvaluationPage() {
  // Render the prediction trend workspace from persisted replay history.
  return (
    <AppShell>
      <PredictionTrendAnalytics />
    </AppShell>
  );
}
