import Link from "next/link";
import { ArrowLeft, Crosshair, Target } from "lucide-react";

export default function DemoPage() {
  // Simple demo route placeholder that links back to the marketing homepage.
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
          <p className="mt-10 text-sm font-bold uppercase tracking-[0.22em] text-orange-300">
            Interactive Demo
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Shot sandbox route
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            This route is ready for the future sandbox UI. For now it marks the
            app route that will connect the court controls to the FastAPI EPPS
            prediction service.
          </p>
        </section>

        <section className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-[#102016]">
          <div className="absolute inset-x-12 top-10 h-28 rounded-b-full border-x border-b border-white/35" />
          <div className="absolute left-1/2 top-10 h-[75%] w-px -translate-x-1/2 bg-white/20" />
          <div className="absolute left-1/2 top-[45%] size-28 -translate-x-1/2 rounded-full border border-white/30" />
          <div className="absolute inset-x-10 bottom-10 h-28 rounded-t-full border-x border-t border-white/35" />
          <div className="absolute bottom-[6.5rem] left-1/2 size-16 -translate-x-1/2 rounded-full border border-orange-300/75" />
          <div className="absolute left-[25%] top-[35%] grid size-14 place-items-center rounded-full bg-orange-300 text-black shadow-[0_0_28px_rgba(249,115,22,0.45)]">
            <Target className="size-6" />
          </div>
          <div className="absolute right-[22%] bottom-[28%] grid size-14 place-items-center rounded-full bg-green-300 text-black shadow-[0_0_28px_rgba(74,222,128,0.45)]">
            <Crosshair className="size-6" />
          </div>
        </section>
      </div>
    </main>
  );
}
