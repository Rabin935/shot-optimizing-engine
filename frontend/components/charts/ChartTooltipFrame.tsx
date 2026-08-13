"use client";

import type { ReactNode } from "react";
import { useChartPalette } from "@/lib/chart-theme";

export function ChartTooltipFrame({
  children,
  title,
}: {
  children: ReactNode;
  title: ReactNode;
}) {
  const palette = useChartPalette();

  return (
    <div
      className="min-w-44 rounded-lg border border-[color:var(--line)] p-3 text-sm shadow-2xl backdrop-blur"
      style={{ background: palette.tooltipBg }}
    >
      <p className="font-black text-foreground">{title}</p>
      <div className="mt-2 grid gap-1 text-xs font-bold text-muted-foreground">
        {children}
      </div>
    </div>
  );
}
