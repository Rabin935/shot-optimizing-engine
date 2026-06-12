import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "Evaluation | ShotOptix",
  description:
    "ShotOptix evaluation workspace for model metrics and prediction quality.",
};

export default function EvaluationPage() {
  return (
    <AppShell>
      <ComingSoon
        title="Evaluation"
        description="A reporting surface for accuracy, precision, recall, F1 score, ROC AUC, and model interpretation."
        phase="Phase 4 Review"
        features={[
          "Metric cards",
          "Confusion matrix view",
          "ROC AUC summary",
          "Threshold comparison",
        ]}
      />
    </AppShell>
  );
}
