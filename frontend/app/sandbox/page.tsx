import Link from "next/link";
import { ArrowLeft, Gauge, Target } from "lucide-react";
import { SandboxExperience } from "@/components/sandbox/SandboxExperience";

export default function SandboxPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080A0D] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(249,115,22,0.12)_0%,transparent_32%,rgba(34,197,94,0.08)_72%,transparent_100%),linear-gradient(180deg,#101318_0%,#080A0D_46%,#050607_100%)]" />
      <nav className="relative z-10 border-b border-white/10 bg-black/35 px-5 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg border border-orange-300/35 bg-orange-500/15 text-orange-100">
              <Target className="size-5" />
            </span>
            <span className="text-lg font-black tracking-tight text-white">
              ShotOptix
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-orange-300/45 hover:bg-orange-500/15 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
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
                Phase 2 Engine
              </p>
              <p className="text-sm font-black text-white">Live Rule Model</p>
            </div>
          </div>
        </header>

        <SandboxExperience />
      </section>
    </main>
  );
}
