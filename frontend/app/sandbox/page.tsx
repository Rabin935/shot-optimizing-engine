import Link from "next/link";
import { ArrowLeft, Gauge, Target, Trophy } from "lucide-react";
import { BasketballCourt } from "@/components/court/BasketballCourt";

export default function SandboxPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-foreground">
      <nav className="border-b border-white/10 bg-black/35 px-5 py-4 backdrop-blur sm:px-6 lg:px-8">
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

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-300">
            Interactive EPPS Lab
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Shot Optimization Sandbox
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
            Drag players to simulate real shots
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.73fr)_minmax(280px,0.27fr)]">
          <section className="min-w-0 rounded-lg border border-white/10 bg-white/[0.035] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.38)] sm:p-5">
            <BasketballCourt>
              <div className="absolute bottom-5 left-5 rounded-lg border border-white/10 bg-black/45 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-200">
                Interactive court workspace
              </div>
            </BasketballCourt>
          </section>

          <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <span className="grid size-10 place-items-center rounded-lg border border-green-300/25 bg-green-400/10 text-green-100">
                <Gauge className="size-5" />
              </span>
              <div>
                <p className="text-sm font-black text-white">Stats Sidebar</p>
                <p className="text-xs text-slate-400">Live shot readout</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="rounded-lg border border-green-300/20 bg-green-400/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-200">
                  Make Probability
                </p>
                <p className="mt-2 text-4xl font-black text-white">48.5%</p>
              </div>
              <div className="rounded-lg border border-orange-300/20 bg-orange-500/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-200">
                  Expected Points
                </p>
                <p className="mt-2 text-4xl font-black text-white">1.28</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Shot Context
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-200">
                  <Trophy className="size-4 text-orange-200" />
                  Awaiting player placement
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
