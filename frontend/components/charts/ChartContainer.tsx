"use client";

import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

type ChartContainerProps = {
  children: ReactNode;
  empty?: boolean;
  emptyLabel?: string;
  height?: number;
};

export function ChartContainer({
  children,
  empty = false,
  emptyLabel = "Save simulator replays to populate this chart.",
  height = 320,
}: ChartContainerProps) {
  // Recharts needs a stable parent height before ResponsiveContainer can render.
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-white/10 bg-black/25 p-3"
      style={{ height }}
    >
      {empty ? (
        <div className="grid h-full place-items-center text-center text-sm font-bold text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      )}
    </div>
  );
}
