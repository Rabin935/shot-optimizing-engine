"use client";

import type { ReactNode } from "react";

type FilterBarProps = {
  children: ReactNode;
  title?: string;
};

export function FilterBar({ children, title = "Filters" }: FilterBarProps) {
  // FilterBar provides the reusable layout; A9 wires it to persistent filters.
  return (
    <section className="rounded-lg border border-white/10 bg-black/30 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          {title}
        </p>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
    </section>
  );
}
