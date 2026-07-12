"use client";

import { Flame, Layers, SplitSquareHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import {
  BASKET_LOCATION,
  COURT_LENGTH_FT,
  COURT_WIDTH_FT,
  calculateDistance,
  type CourtPoint,
} from "@/utils/courtMath";
import { generateEppsMap } from "@/lib/session-insights";
import { formatDistanceByUnits } from "@/lib/settings-preferences";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useShotStore } from "@/store/useShotStore";

const SVG_WIDTH = 720;
const SVG_HEIGHT = 620;
type HeatmapPoint = ReturnType<typeof generateEppsMap>[number];
type LayeredHeatmapPoint = HeatmapPoint & {
  density: number;
  makeProbability: number;
  pressureScore: number;
};
type HeatmapLayer = "density" | "epps" | "probability" | "pressure" | "zone";
type HeatmapFilters = {
  maxPressure: number;
  minEpps: number;
  minProbability: number;
  zone: string;
};

const defaultHeatmapFilters: HeatmapFilters = {
  maxPressure: 1,
  minEpps: 0,
  minProbability: 0,
  zone: "all",
};

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
  const comparisonMode = useShotStore((state) => state.comparisonMode);
  const setComparisonMode = useShotStore((state) => state.setComparisonMode);
  const units = useSettingsStore((state) => state.settings.units);
  const activeDefenders = defenders.slice(0, activeDefenderCount);
  const mapPoints = useMemo(
    () => generateEppsMap({ defenders: activeDefenders }),
    [activeDefenders],
  );
  const layeredPoints = useMemo(
    () =>
      mapPoints.map((point) => enrichHeatmapPoint(point, activeDefenders)),
    [activeDefenders, mapPoints],
  );
  const [activeLayer, setActiveLayer] = useState<HeatmapLayer>("epps");
  const [filters, setFilters] = useState(defaultHeatmapFilters);
  const filteredPoints = useMemo(
    () =>
      layeredPoints.filter(
        (point) =>
          point.epps >= filters.minEpps &&
          point.makeProbability >= filters.minProbability &&
          point.pressureScore <= filters.maxPressure &&
          (filters.zone === "all" || point.zone === filters.zone),
      ),
    [filters, layeredPoints],
  );
  const comparisonPoints = useMemo(
    () =>
      generateEppsMap({ defenders: [] }).map((point) =>
        enrichHeatmapPoint(point, []),
      ),
    [],
  );
  const comparisonByKey = useMemo(
    () =>
      new Map(
        comparisonPoints.map((point) => [
          `${point.x}-${point.y}`,
          point,
        ]),
      ),
    [comparisonPoints],
  );
  const availableZones = useMemo(
    () => Array.from(new Set(layeredPoints.map((point) => point.zone))),
    [layeredPoints],
  );
  const [preview, setPreview] = useState<LayeredHeatmapPoint | undefined>(
    layeredPoints[0],
  );

  function handlePreview(point: LayeredHeatmapPoint) {
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
            {!filteredPoints.length ? (
              <text
                x={SVG_WIDTH / 2}
                y={SVG_HEIGHT / 2}
                fill="#94a3b8"
                fontSize="18"
                fontWeight="900"
                textAnchor="middle"
              >
                No heatmap points match the current filters
              </text>
            ) : null}
            {filteredPoints.map((point) => {
              const pixel = pointToSvg(point);
              const radius = getLayerRadius(point, activeLayer);
              const comparisonPoint = comparisonByKey.get(`${point.x}-${point.y}`);
              const delta = comparisonPoint ? point.epps - comparisonPoint.epps : 0;

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
                    r={radius}
                    fill={getLayerColor(point, activeLayer)}
                    opacity={activeLayer === "density" ? 0.62 + point.density * 0.28 : 0.82}
                    stroke="rgba(255,255,255,0.28)"
                    strokeWidth="2"
                    className="transition-all duration-300"
                  />
                  {comparisonMode ? (
                    <circle
                      cx={pixel.x}
                      cy={pixel.y}
                      r={radius + 6}
                      fill="none"
                      stroke={delta >= 0 ? "#86efac" : "#f87171"}
                      strokeDasharray="5 4"
                      strokeWidth="3"
                      opacity="0.82"
                      className="transition-all duration-300"
                    />
                  ) : null}
                  <text
                    x={pixel.x}
                    y={pixel.y + 4}
                    fill="#020617"
                    fontSize="10"
                    fontWeight="900"
                    textAnchor="middle"
                  >
                    {formatLayerLabel(point, activeLayer)}
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
                <h2 className="text-lg font-black text-white">
                  {comparisonMode ? "Comparison mode" : "Single view"}
                </h2>
              </div>
            </div>
            <button
              type="button"
              aria-pressed={comparisonMode}
              onClick={() => setComparisonMode(!comparisonMode, "simulator")}
              className={`mt-4 min-h-10 w-full rounded-lg border px-3 text-sm font-black transition ${
                comparisonMode
                  ? "border-green-300/35 bg-green-400/15 text-green-100"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"
              }`}
            >
              {comparisonMode ? "Disable comparison" : "Compare to open court"}
            </button>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {comparisonMode
                ? "Rings show EPPS delta versus an open-court baseline."
                : "Switch layers to inspect density, expected points, make probability, defensive pressure, or court zone behavior."}
            </p>
          </article>
          <article className="rounded-lg border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Heatmap Filters
              </p>
              <button
                type="button"
                onClick={() => setFilters(defaultHeatmapFilters)}
                className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-black text-slate-300 transition hover:border-orange-300/35 hover:text-orange-100"
              >
                Reset
              </button>
            </div>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Zone
                <select
                  value={filters.zone}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, zone: event.target.value }))
                  }
                  className="min-h-10 rounded-lg border border-white/10 bg-[#111] px-3 text-sm font-bold normal-case tracking-normal text-white"
                >
                  <option value="all">All zones</option>
                  {availableZones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </label>
              <RangeFilter
                label="Min EPPS"
                max={1.8}
                step={0.05}
                value={filters.minEpps}
                onChange={(minEpps) =>
                  setFilters((current) => ({ ...current, minEpps }))
                }
              />
              <RangeFilter
                label="Min Make"
                max={0.85}
                step={0.01}
                value={filters.minProbability}
                onChange={(minProbability) =>
                  setFilters((current) => ({ ...current, minProbability }))
                }
              />
              <RangeFilter
                label="Max Pressure"
                max={1}
                step={0.05}
                value={filters.maxPressure}
                onChange={(maxPressure) =>
                  setFilters((current) => ({ ...current, maxPressure }))
                }
              />
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Showing {filteredPoints.length} / {layeredPoints.length} points
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
              <InfoRow
                label="Make Probability"
                value={`${Math.round((preview?.makeProbability ?? 0) * 100)}%`}
              />
              <InfoRow
                label="Pressure"
                value={`${Math.round((preview?.pressureScore ?? 0) * 100)} / 100`}
              />
              <InfoRow label="Quality" value={preview?.quality ?? "Poor"} />
              <InfoRow
                label="Court Position"
                value={`${formatDistanceByUnits(preview?.x ?? 0, units)}, ${formatDistanceByUnits(preview?.y ?? 0, units)}`}
              />
            </div>
          </article>
          <article className="rounded-lg border border-white/10 bg-black/30 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Layer Legend
            </p>
            <div className="mt-3 grid gap-2">
              {getLayerLegend(activeLayer).map((item) => (
                <Legend key={item.label} color={item.color} label={item.label} />
              ))}
              {comparisonMode ? (
                <>
                  <Legend color="#86efac" label="Positive comparison delta" />
                  <Legend color="#f87171" label="Negative comparison delta" />
                </>
              ) : null}
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

const zoneColor: Record<string, string> = {
  "Above Break Three": "#60a5fa",
  "Corner Three": "#38bdf8",
  "Mid-Range": "#fbbf24",
  Paint: "#86efac",
};

function enrichHeatmapPoint(
  point: HeatmapPoint,
  defenders: CourtPoint[],
): LayeredHeatmapPoint {
  const nearestDefender = defenders.reduce(
    (nearest, defender) =>
      Math.min(nearest, calculateDistance(point, defender)),
    Number.POSITIVE_INFINITY,
  );
  const distanceToRim = calculateDistance(point, BASKET_LOCATION);
  const shotValue = distanceToRim >= 22 || point.zone.includes("Three") ? 3 : 2;
  const makeProbability = Math.min(point.epps / shotValue, 0.82);
  const pressureScore = Number.isFinite(nearestDefender)
    ? Math.max(0, 1 - Math.min(nearestDefender, 10) / 10)
    : 0;
  const density = Math.max(0.15, 1 - Math.min(distanceToRim, 32) / 36);

  return {
    ...point,
    density,
    makeProbability,
    pressureScore,
  };
}

function getLayerLegend(layer: HeatmapLayer) {
  if (layer === "density") {
    return [
      { color: "rgba(251,146,60,0.86)", label: "Larger circles: higher shot density" },
      { color: "rgba(251,146,60,0.48)", label: "Smaller circles: lower density" },
    ];
  }

  if (layer === "probability") {
    return [
      { color: "#86efac", label: "High make probability" },
      { color: "#facc15", label: "Medium make probability" },
      { color: "#f87171", label: "Low make probability" },
    ];
  }

  if (layer === "pressure") {
    return [
      { color: "#f87171", label: "High pressure" },
      { color: "#facc15", label: "Medium pressure" },
      { color: "#86efac", label: "Low pressure" },
    ];
  }

  if (layer === "zone") {
    return Object.entries(zoneColor).map(([label, color]) => ({ color, label }));
  }

  return [
    { color: "#4ade80", label: "Excellent EPPS" },
    { color: "#facc15", label: "Good EPPS" },
    { color: "#f87171", label: "Poor EPPS" },
  ];
}

function RangeFilter({
  label,
  max,
  onChange,
  step,
  value,
}: {
  label: string;
  max: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <label className="grid gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
      <span className="flex items-center justify-between gap-3">
        {label}
        <span className="text-slate-300">{value.toFixed(step < 0.05 ? 2 : 1)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-orange-400"
      />
    </label>
  );
}

function getLayerColor(point: LayeredHeatmapPoint, layer: HeatmapLayer) {
  if (layer === "density") {
    return "rgba(251,146,60,0.86)";
  }

  if (layer === "probability") {
    return interpolateColor(point.makeProbability, [
      [0.25, "#f87171"],
      [0.5, "#facc15"],
      [0.75, "#86efac"],
    ]);
  }

  if (layer === "pressure") {
    return interpolateColor(point.pressureScore, [
      [0.2, "#86efac"],
      [0.55, "#facc15"],
      [0.9, "#f87171"],
    ]);
  }

  if (layer === "zone") {
    return zoneColor[point.zone] ?? "#c084fc";
  }

  return qualityColor[point.quality];
}

function getLayerRadius(point: LayeredHeatmapPoint, layer: HeatmapLayer) {
  if (layer === "density") {
    return 10 + point.density * 14;
  }

  if (layer === "pressure") {
    return 10 + point.pressureScore * 12;
  }

  return 16;
}

function formatLayerLabel(point: LayeredHeatmapPoint, layer: HeatmapLayer) {
  if (layer === "probability") {
    return `${Math.round(point.makeProbability * 100)}`;
  }

  if (layer === "pressure") {
    return `${Math.round(point.pressureScore * 10)}`;
  }

  if (layer === "density") {
    return `${Math.round(point.density * 10)}`;
  }

  if (layer === "zone") {
    return point.zone.slice(0, 1);
  }

  return point.epps.toFixed(1);
}

function interpolateColor(
  value: number,
  stops: Array<[number, string]>,
) {
  const match = stops.find(([stop]) => value <= stop);

  return match?.[1] ?? stops[stops.length - 1][1];
}
