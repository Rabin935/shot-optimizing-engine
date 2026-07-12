"use client";

import { Flame, Layers, SplitSquareHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import {
  BASKET_LOCATION,
  COURT_LENGTH_FT,
  COURT_WIDTH_FT,
  type CourtPoint,
} from "@/utils/courtMath";
import { generateEppsMap } from "@/lib/session-insights";
import { formatDistanceByUnits } from "@/lib/settings-preferences";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useShotStore } from "@/store/useShotStore";

const SVG_WIDTH = 720;
const SVG_HEIGHT = 620;
type HeatmapPoint = ReturnType<typeof generateEppsMap>[number];
type HeatmapLayer = "density" | "epps" | "probability" | "pressure" | "zone";

const heatmapLayers: Array<{ label: string; value: HeatmapLayer }> = [
  { label: "Shot Density", value: "density" },
  { label: "EPPS", value: "epps" },
  { label: "Make Probability", value: "probability" },
  { label: "Pressure", value: "pressure" },
  { label: "Zone", value: "zone" },
];

export function AdvancedShotOptimizationMap() {
  const activeDefenderCount = useShotStore((state) => state.activeDefenderCount);
  const defenders = useShotStore((state) => state.defenders);
  const shooter = useShotStore((state) => state.shooter);
  const setShooterPosition = useShotStore((state) => state.setShooterPosition);
  const units = useSettingsStore((state) => state.settings.units);
  const activeDefenders = defenders.slice(0, activeDefenderCount);
  const mapPoints = useMemo(
    () => generateEppsMap({ defenders: activeDefenders }),
    [activeDefenders],
  );
  const [activeLayer, setActiveLayer] = useState<HeatmapLayer>("epps");
  const [preview, setPreview] = useState(mapPoints[0]);

  function handlePreview(point: HeatmapPoint) {
    setPreview(point);
  }

  return (
    <section className="grid gap-6">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">
          Advanced Shot Optimization Map
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
          Full-court predicted EPPS
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          Scan the whole half-court, preview any shot, and click a spot to send
          it directly into the shared simulator and sandbox state.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-lg border border-white/10 bg-[#10160f] shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg border border-green-300/25 bg-green-400/10 text-green-100">
                <Layers className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Layered Heatmap
                </p>
                <h2 className="text-lg font-black text-white">
                  {heatmapLayers.find((layer) => layer.value === activeLayer)?.label}
                </h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {heatmapLayers.map((layer) => (
                <button
                  key={layer.value}
                  type="button"
                  aria-pressed={activeLayer === layer.value}
                  onClick={() => setActiveLayer(layer.value)}
                  className={`min-h-9 rounded-lg border px-3 text-xs font-black transition ${
                    activeLayer === layer.value
                      ? "border-orange-300/40 bg-orange-500/15 text-orange-100"
                      : "border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
                  }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="block h-[520px] w-full"
            role="img"
            aria-label="Court EPPS heatmap"
          >
            <defs>
              <linearGradient id="heatmap-floor" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#203925" />
                <stop offset="1" stopColor="#0b0f0d" />
              </linearGradient>
            </defs>
            <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#heatmap-floor)" />
            <CourtLines />
            {mapPoints.map((point) => {
              const pixel = pointToSvg(point);

              return (
                <button
                  key={`${point.x}-${point.y}`}
                  type="button"
                  onMouseEnter={() => handlePreview(point)}
                  onFocus={() => handlePreview(point)}
                  onClick={() => setShooterPosition({ x: point.x, y: point.y }, "simulator")}
                >
                  <circle
                    cx={pixel.x}
                    cy={pixel.y}
                    r={16}
                    fill={qualityColor[point.quality]}
                    opacity="0.78"
                    stroke="rgba(255,255,255,0.28)"
                    strokeWidth="2"
                  />
                  <text
                    x={pixel.x}
                    y={pixel.y + 4}
                    fill="#020617"
                    fontSize="10"
                    fontWeight="900"
                    textAnchor="middle"
                  >
                    {point.epps.toFixed(1)}
                  </text>
                </button>
              );
            })}
            <Marker point={shooter} color="#fb923c" label="Current" />
            <Marker point={BASKET_LOCATION} color="#f8fafc" label="Rim" />
          </svg>
        </section>

        <aside className="grid gap-4">
          <article className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg border border-sky-300/25 bg-sky-400/10 text-sky-100">
                <SplitSquareHorizontal className="size-4" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Mode
                </p>
                <h2 className="text-lg font-black text-white">Single view</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Switch layers to inspect density, expected points, make
              probability, defensive pressure, or court zone behavior.
            </p>
          </article>
          <article className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg border border-orange-300/25 bg-orange-500/10 text-orange-100">
                <Flame className="size-4" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Preview
                </p>
                <h2 className="text-lg font-black text-white">{preview?.zone}</h2>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <InfoRow label="EPPS" value={preview?.epps.toFixed(2) ?? "0.00"} />
              <InfoRow label="Quality" value={preview?.quality ?? "Poor"} />
              <InfoRow
                label="Court Position"
                value={`${formatDistanceByUnits(preview?.x ?? 0, units)}, ${formatDistanceByUnits(preview?.y ?? 0, units)}`}
              />
            </div>
          </article>
          <article className="rounded-lg border border-white/10 bg-black/30 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Legend
            </p>
            <div className="mt-3 grid gap-2">
              <Legend color="#4ade80" label="Excellent" />
              <Legend color="#facc15" label="Good" />
              <Legend color="#f87171" label="Poor" />
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

function CourtLines() {
  return (
    <g fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3">
      <rect x="44" y="42" width="632" height="536" rx="12" />
      <path d="M44 170H676M170 42V230M550 42V230" />
      <path d="M264 42v190h192V42" />
      <path d="M160 170C206 350 514 350 560 170" />
      <circle cx="360" cy="112" r="28" stroke="#fb923c" />
    </g>
  );
}

function Marker({
  color,
  label,
  point,
}: {
  color: string;
  label: string;
  point: CourtPoint;
}) {
  const pixel = pointToSvg(point);

  return (
    <g>
      <circle cx={pixel.x} cy={pixel.y} r="10" fill={color} stroke="#020617" strokeWidth="3" />
      <text x={pixel.x + 13} y={pixel.y - 10} fill={color} fontSize="12" fontWeight="900">
        {label}
      </text>
    </g>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold text-slate-200">
      <span className="size-3 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <span className="text-sm font-black text-white">{value}</span>
    </div>
  );
}

function pointToSvg(point: CourtPoint) {
  return {
    x: 44 + (point.x / COURT_WIDTH_FT) * 632,
    y: 42 + (point.y / COURT_LENGTH_FT) * 536,
  };
}

const qualityColor: Record<string, string> = {
  Excellent: "#4ade80",
  Good: "#facc15",
  Poor: "#f87171",
};
