import type { Metadata } from "next";
import { LazySimulatorStateControls } from "@/components/performance/LazyWorkspaces";

export const metadata: Metadata = {
  // Route metadata for the future mechanics simulator workspace.
  title: "2D Simulator | ShotOptix",
  description:
    "ShotOptix 2D simulator workspace for body mechanics and defender contest experiments.",
};

export default function SimulatorPage() {
  // Render the Phase 5 prototype that consumes the shared shot store.
  return (
      <section className="mx-auto flex w-full max-w-[96rem] flex-col gap-7">
        <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">
            Phase 5 Shared State
          </p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            2D Stickman Simulator
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            A synthetic mechanics stage that reads shared shot state and sends
            adjusted shooter and defender context back to Court Sandbox.
          </p>
        </header>

        <LazySimulatorStateControls />
      </section>
  );
}
