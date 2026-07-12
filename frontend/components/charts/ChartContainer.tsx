"use client";

import { Inspect, Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import { ResponsiveContainer } from "recharts";
import { Button, Dialog, IconButton, Tooltip } from "@/components/ui";
import { useChartInteractionStore } from "@/lib/analytics/chart-interaction-store";
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
  const chartId = useId();
  const activeChartId = useChartInteractionStore((state) => state.activeChartId);
  const activeDatumLabel = useChartInteractionStore((state) => state.activeDatumLabel);
  const setActiveDatum = useChartInteractionStore((state) => state.setActiveDatum);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [zoom, setZoom] = useState(1);
  const zoomPercent = Math.round(zoom * 100);
  const isActive = activeChartId === chartId;

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
          style={{ transform: `scale(${zoom})`, willChange: "transform" }}
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
      <div
        aria-label={title}
        className={cx(
          "rounded-lg border bg-black/25 p-3 transition",
          isActive
            ? "border-orange-300/45 shadow-[0_0_0_1px_rgba(253,186,116,0.18)]"
            : "border-white/10",
        )}
        role="region"
        onBlur={() => setActiveDatum(chartId, null)}
        onFocus={() => setActiveDatum(chartId, title)}
        onMouseEnter={() => setActiveDatum(chartId, title)}
        onMouseLeave={() => setActiveDatum(chartId, null)}
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            {isActive ? activeDatumLabel : `${zoomPercent}% zoom`}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-1">
            <IconTool label="Drill down">
              <IconButton
                aria-pressed={showDetails}
                aria-label="Toggle chart details"
                onClick={() => setShowDetails((current) => !current)}
              >
                <Inspect className="size-4" />
              </IconButton>
            </IconTool>
            <IconTool label="Zoom out">
              <IconButton
                aria-label="Zoom out chart"
                onClick={() => setZoom((current) => Math.max(0.75, current - 0.15))}
              >
                <Minus className="size-4" />
              </IconButton>
            </IconTool>
            <IconTool label="Zoom in">
              <IconButton
                aria-label="Zoom in chart"
                onClick={() => setZoom((current) => Math.min(1.6, current + 0.15))}
              >
                <Plus className="size-4" />
              </IconButton>
            </IconTool>
            <IconTool label="Reset zoom">
              <IconButton
                aria-label="Reset chart zoom"
                onClick={() => setZoom(1)}
              >
                <RotateCcw className="size-4" />
              </IconButton>
            </IconTool>
            <IconTool label="Full screen">
              <IconButton
                aria-label="Open chart full screen"
                onClick={() => setIsFullscreen(true)}
              >
                <Maximize2 className="size-4" />
              </IconButton>
            </IconTool>
          </div>
        </div>
        {renderChart(height)}
        {showDetails ? (
          <div className="mt-3 grid gap-2 rounded-lg border border-white/10 bg-black/30 p-3 text-xs font-bold text-slate-300 sm:grid-cols-3">
            <span>Chart: {title}</span>
            <span>Zoom: {zoomPercent}%</span>
            <span>Mode: {isFullscreen ? "Fullscreen" : "Inline"}</span>
          </div>
        ) : null}
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
