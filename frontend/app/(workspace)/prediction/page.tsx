import type { Metadata } from "next";
import { PredictionAnalysisWorkspace } from "@/components/prediction/PredictionAnalysisWorkspace";

export const metadata: Metadata = {
  title: "Prediction | ShotOptix",
  description:
    "ShotOptix machine learning prediction analysis for the selected shot.",
};

export default function PredictionPage() {
  return <PredictionAnalysisWorkspace />;
}
