import type { Metadata } from "next";
import { Gauge } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SandboxExperience } from "@/components/sandbox/SandboxExperience";

export const metadata: Metadata = {
  title: "Court Sandbox | ShotOptix",
  description:
    "Interactive ShotOptix court sandbox for spacing, pressure, EPPS, and ML-backed shot prediction.",
};

export default function SandboxPage() {
  return (
    <AppShell>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-7">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-300">
              Interactive EPPS Lab
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Shot Optimization Sandbox
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
              Live spacing, pressure, shot value, and expected points for every
              simulated possession.
            </p>
          </div>
          <div className="flex w-fit items-center gap-3 rounded-lg border border-green-300/20 bg-green-400/10 px-4 py-3 text-green-100 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur">
            <Gauge className="size-5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-75">
                Phase 4 Engine
              </p>
              <p className="text-sm font-black text-white">
                ML + Fallback Model
              </p>
            </div>
          </div>
        </header>

        <SandboxExperience />
      </section>
    </AppShell>
  );
}
