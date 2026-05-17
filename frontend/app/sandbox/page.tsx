import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import { SandboxExperience } from "@/components/sandbox/SandboxExperience";

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
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Shot Optimization Sandbox
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
            Drag players to simulate real shots
          </p>
        </header>

        <SandboxExperience />
      </section>
    </main>
  );
}
