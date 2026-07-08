import { ArrowUpRight, CheckCircle2 } from "lucide-react";

type ComingSoonProps = {
  description: string;
  features: string[];
  phase: string;
  title: string;
};

export function ComingSoon({
  description,
  features,
  phase,
  title,
}: ComingSoonProps) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-center gap-8 py-6">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-300">
          {phase}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          {description}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-orange-300/20 bg-orange-500/[0.08] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-200">
                Roadmap Status
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">
                Coming Soon
              </h2>
            </div>
            <span className="grid size-11 place-items-center rounded-lg border border-orange-300/25 bg-black/25 text-orange-100">
              <ArrowUpRight className="size-5" />
            </span>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-300">
            This workspace is reserved in the app navigation so the Phase 4
            dashboard already feels complete while each analytics module is
            built out.
          </p>
        </article>

        <article className="rounded-lg border border-white/10 bg-black/30 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-200">
            Planned Surface
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex min-h-16 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-3"
              >
                <CheckCircle2 className="size-5 shrink-0 text-green-200" />
                <span className="text-sm font-bold leading-5 text-slate-200">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
