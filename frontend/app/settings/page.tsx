import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsWorkspace } from "@/components/settings/SettingsWorkspace";

export const metadata: Metadata = {
  title: "Settings | ShotOptix",
  description:
    "Personalize ShotOptix appearance, simulator defaults, court preferences, analytics charts, and notifications.",
};

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsWorkspace />
    </AppShell>
  );
}
