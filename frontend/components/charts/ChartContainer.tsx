"use client";

import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import { ResponsiveContainer } from "recharts";
import { Button, Dialog, Tooltip } from "@/components/ui";
import { cx } from "@/lib/design-system";

type ChartContainerProps = {
  children: ReactNode;
  empty?: boolean;
  emptyLabel?: string;
  height?: number;
  title?: string;
};

export function ChartContainer({
  children,
  empty = false,
  emptyLabel = "Save simulator replays to populate this chart.",
  height = 320,
  title = "Analytics chart",
}: ChartContainerProps) {
  const dialogTitleId = useId();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const zoomPercent = Math.round(zoom * 100);

  const renderChart = (chartHeight: number | string) => (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{ height: chartHeight }}
    >
      {empty ? (
        <div className="grid h-full place-items-center text-center text-sm font-bold text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <div
          className="h-full min-w-full origin-center transition-transform"
          style={{ transform: `scale(${zoom})` }}
        >
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  // Recharts needs a stable parent height before ResponsiveContainer can render.
  return (
    <>
      <div className="rounded-lg border border-white/10 bg-black/25 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            {zoomPercent}% zoom
          </span>
          <div className="flex items-center gap-1">
            <IconTool label="Zoom out">
              <button
                type="button"
                aria-label="Zoom out chart"
                onClick={() => setZoom((current) => Math.max(0.75, current - 0.15))}
                className={iconButtonClass}
              >
                <Minus className="size-4" />
              </button>
            </IconTool>
            <IconTool label="Zoom in">
              <button
                type="button"
                aria-label="Zoom in chart"
                onClick={() => setZoom((current) => Math.min(1.6, current + 0.15))}
                className={iconButtonClass}
              >
                <Plus className="size-4" />
              </button>
            </IconTool>
            <IconTool label="Reset zoom">
              <button
                type="button"
                aria-label="Reset chart zoom"
                onClick={() => setZoom(1)}
                className={iconButtonClass}
              >
                <RotateCcw className="size-4" />
              </button>
            </IconTool>
            <IconTool label="Full screen">
              <button
                type="button"
                aria-label="Open chart full screen"
                onClick={() => setIsFullscreen(true)}
                className={iconButtonClass}
              >
                <Maximize2 className="size-4" />
              </button>
            </IconTool>
          </div>
        </div>
        {renderChart(height)}
      </div>

      <Dialog
        labelledBy={dialogTitleId}
        open={isFullscreen}
        className="max-w-6xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={dialogTitleId} className="text-xl font-black text-white">
            {title}
          </h2>
          <Button type="button" variant="outline" onClick={() => setIsFullscreen(false)}>
            Close
          </Button>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/25 p-3">
          {renderChart("72vh")}
        </div>
      </Dialog>
    </>
  );
}

function IconTool({ children, label }: { children: ReactNode; label: string }) {
  return <Tooltip content={label}>{children}</Tooltip>;
}

const iconButtonClass = cx(
  "grid size-8 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-orange-300/35 hover:text-orange-100",
);
