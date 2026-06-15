import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SimulatorStateControls } from "@/components/simulator/SimulatorStateControls";

export const metadata: Metadata = {
  // Route metadata for the future mechanics simulator workspace.
  title: "2D Simulator | ShotOptix",
  description:
    "ShotOptix 2D simulator workspace for body mechanics and defender contest experiments.",
};

export default function SimulatorPage() {
  // Render shared state controls first; the stickman can consume this store later.
  return (
    <AppShell>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-7">
        <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">
            Phase 5 Shared State
          </p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            2D Simulator Control State
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Position and pose values here are shared with the live Court Sandbox.
          </p>
        </header>

        <SimulatorStateControls />
      </section>
    </AppShell>
  );
}
