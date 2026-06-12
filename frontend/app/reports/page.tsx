import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "Reports | ShotOptix",
  description:
    "ShotOptix reports workspace for exporting model, EPPS, and shot analysis summaries.",
};

export default function ReportsPage() {
  return (
    <AppShell>
      <ComingSoon
        title="Reports"
        description="A reporting workspace for turning model results and sandbox experiments into readable summaries."
        phase="Phase 5 Preview"
        features={[
          "PDF-ready summaries",
          "Shot chart snapshots",
          "Model metric exports",
          "Viva explanation notes",
        ]}
      />
    </AppShell>
  );
}
