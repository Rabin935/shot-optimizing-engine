"use client";

import {
  Activity,
  Crosshair,
  Eye,
  EyeOff,
  Gauge,
  RotateCcw,
  Target,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import type {
  CourtPoint,
  SandboxDefender,
  SandboxStats,
} from "@/lib/sandbox-metrics";

export type SandboxScenario = {
  defenders: SandboxDefender[];
  id: string;
  label: string;
  shooter: CourtPoint;
};

export type SandboxToggles = {
  analyticsOverlay: boolean;
  courtLabels: boolean;
  defenderRadius: boolean;
  shotLine: boolean;
};

type SandboxControlsProps = {
  activeScenario: string;
  defenderCount: 1 | 2;
  onApplyScenario: (scenario: SandboxScenario) => void;
  onReset: () => void;
  onToggleDefenderCount: () => void;
  onToggleSetting: (key: keyof SandboxToggles) => void;
  scenarios: SandboxScenario[];
  stats: SandboxStats;
  toggles: SandboxToggles;
};

export function SandboxControls({
  activeScenario,
  defenderCount,
  onApplyScenario,
  onReset,
  onToggleDefenderCount,
  onToggleSetting,
  scenarios,
  stats,
  toggles,
}: SandboxControlsProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3 shadow-[0_18px_55px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => onApplyScenario(scenario)}
              className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition ${
                activeScenario === scenario.id
                  ? "border-green-300/55 bg-green-400/15 text-green-100 shadow-[0_0_22px_rgba(74,222,128,0.16)]"
                  : "border-white/10 bg-white/[0.06] text-slate-200 hover:border-green-300/40 hover:bg-green-400/10 hover:text-white"
              }`}
            >
              <Crosshair className="size-4" />
              {scenario.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <button
            type="button"
            onClick={onToggleDefenderCount}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-sky-300/25 bg-sky-500/10 px-3 py-2 text-sm font-bold text-sky-100 transition hover:border-sky-300/55 hover:bg-sky-500/20"
          >
            <Users className="size-4" />
            {defenderCount} Defender{defenderCount > 1 ? "s" : ""}
          </button>

          <ToggleButton
            active={toggles.courtLabels}
            icon={toggles.courtLabels ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            label="Labels"
            onClick={() => onToggleSetting("courtLabels")}
          />
          <ToggleButton
            active={toggles.defenderRadius}
            icon={<Target className="size-4" />}
            label="Radius"
            onClick={() => onToggleSetting("defenderRadius")}
          />
          <ToggleButton
            active={toggles.shotLine}
            icon={<Activity className="size-4" />}
            label="Shot Line"
            onClick={() => onToggleSetting("shotLine")}
          />
          <ToggleButton
            active={toggles.analyticsOverlay}
            icon={<Gauge className="size-4" />}
            label="Analytics"
            onClick={() => onToggleSetting("analyticsOverlay")}
          />

          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-orange-300/25 bg-orange-500/10 px-3 py-2 text-sm font-bold text-orange-100 transition hover:border-orange-300/55 hover:bg-orange-500/20"
          >
            <RotateCcw className="size-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
        <ControlReadout label="Zone" value={stats.shotZone} />
        <ControlReadout label="Quality" value={stats.shotQuality} />
        <ControlReadout label="EPPS" value={stats.expectedPoints.toFixed(2)} />
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition ${
        active
          ? "border-white/20 bg-white/[0.11] text-white"
          : "border-white/10 bg-white/[0.045] text-slate-400 hover:border-white/20 hover:text-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ControlReadout({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <span className="truncate text-sm font-black text-white">{value}</span>
    </div>
  );
}
