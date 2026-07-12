import type { ReactNode } from "react";

export function ChartTooltipFrame({
  children,
  title,
}: {
  children: ReactNode;
  title: ReactNode;
}) {
  return (
    <div className="min-w-44 rounded-lg border border-white/10 bg-[#090909]/95 p-3 text-sm shadow-2xl backdrop-blur">
      <p className="font-black text-white">{title}</p>
      <div className="mt-2 grid gap-1 text-xs font-bold text-slate-300">
        {children}
      </div>
    </div>
  );
}
