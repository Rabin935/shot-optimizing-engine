import type { Metadata } from "next";
import { MlEvaluationDashboard } from "@/components/evaluation/MlEvaluationDashboard";

export const metadata: Metadata = {
  title: "Evaluation | ShotOptix",
  description:
    "ShotOptix machine learning evaluation metrics for the trained XGBoost model.",
};

export default function EvaluationPage() {
  return <MlEvaluationDashboard />;
}
