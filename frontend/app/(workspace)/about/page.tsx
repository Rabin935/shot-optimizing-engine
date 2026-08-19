import type { Metadata } from "next";
import { ProjectOverview } from "@/components/about/ProjectOverview";

export const metadata: Metadata = {
  title: "About | ShotOptix",
  description:
    "Professional project overview for ShotOptix thesis and portfolio presentation.",
};

export default function AboutPage() {
  return <ProjectOverview />;
}
