import type { Metadata } from "next";
import { ModelInfoDocumentation } from "@/components/model/ModelInfoDocumentation";

export const metadata: Metadata = {
  title: "Model Info | ShotOptix",
  description:
    "Technical documentation for the ShotOptix machine learning system.",
};

export default function ModelInfoPage() {
  return <ModelInfoDocumentation />;
}
