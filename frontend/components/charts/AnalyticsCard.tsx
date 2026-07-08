import type { ReactNode } from "react";

type AnalyticsCardProps = {
  action?: ReactNode;
  children: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function AnalyticsCard({
  action,
  children,
  description,
  eyebrow,
  title,
}: AnalyticsCardProps) {
  // Shared card shell keeps chart pages visually consistent.
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-300">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-xl font-black tracking-tight text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
