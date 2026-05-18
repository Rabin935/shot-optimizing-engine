"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Crosshair,
  Eye,
  EyeOff,
  Layers,
  RotateCcw,
  Users,
} from "lucide-react";
import { SandboxCourt } from "@/components/sandbox/SandboxCourt";
import { StatsPanel } from "@/components/sandbox/StatsPanel";
import {
  calculateSandboxStats,
  type CourtPoint,
  type SandboxDefender,
} from "@/lib/sandbox-metrics";

const INITIAL_SHOOTER: CourtPoint = { x: 38, y: 26 };
const INITIAL_DEFENDERS: SandboxDefender[] = [
  { id: "d1", label: "D1", point: { x: 33, y: 23 }, tone: "red" },
  { id: "d2", label: "D2", point: { x: 18, y: 20 }, tone: "blue" },
];

const SCENARIOS = [
  {
    id: "corner-three",
    label: "Corner 3",
    shooter: { x: 47, y: 11 },
    defenders: [
      { id: "d1", label: "D1", point: { x: 42, y: 12 }, tone: "red" },
      { id: "d2", label: "D2", point: { x: 31, y: 19 }, tone: "blue" },
    ],
  },
  {
    id: "paint-touch",
    label: "Paint Touch",
    shooter: { x: 25, y: 9 },
    defenders: [
      { id: "d1", label: "D1", point: { x: 25, y: 11.5 }, tone: "red" },
      { id: "d2", label: "D2", point: { x: 31, y: 15 }, tone: "blue" },
    ],
  },
  {
    id: "wing-pullup",
    label: "Wing Pull-Up",
    shooter: { x: 38, y: 26 },
    defenders: [
      { id: "d1", label: "D1", point: { x: 33, y: 23 }, tone: "red" },
      { id: "d2", label: "D2", point: { x: 18, y: 20 }, tone: "blue" },
    ],
  },
] satisfies {
  id: string;
  label: string;
  shooter: CourtPoint;
  defenders: SandboxDefender[];
}[];

export function SandboxExperience() {
  const [shooter, setShooter] = useState<CourtPoint>(INITIAL_SHOOTER);
  const [defenders, setDefenders] =
    useState<SandboxDefender[]>(INITIAL_DEFENDERS);
  const [showCourtLines, setShowCourtLines] = useState(true);
  const [activeScenario, setActiveScenario] = useState("wing-pullup");
  const [defenderCount, setDefenderCount] = useState<1 | 2>(2);
  const activeDefenders = useMemo(
    () => defenders.slice(0, defenderCount),
    [defenderCount, defenders],
  );
  const stats = useMemo(
    () => calculateSandboxStats(shooter, activeDefenders),
    [activeDefenders, shooter],
  );

  const handleDefenderMove = (id: string, point: CourtPoint) => {
    setDefenders((current) =>
      current.map((defender) =>
        defender.id === id ? { ...defender, point } : defender,
      ),
    );
    setActiveScenario("custom");
  };

  const resetPositions = () => {
    setShooter(INITIAL_SHOOTER);
    setDefenders(INITIAL_DEFENDERS);
    setDefenderCount(2);
    setActiveScenario("wing-pullup");
  };

  const applyScenario = (scenario: (typeof SCENARIOS)[number]) => {
    setShooter(scenario.shooter);
    setDefenders(scenario.defenders);
    setDefenderCount(2);
    setActiveScenario(scenario.id);
  };

  return (
    <motion.div
      className="grid gap-6 lg:grid-cols-[minmax(0,0.73fr)_minmax(280px,0.27fr)]"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <section className="min-w-0 rounded-lg border border-white/10 bg-white/[0.035] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.38)] sm:p-5">
        <div className="mb-4 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
            <span className="h-2 w-2 rounded-full bg-green-300 shadow-[0_0_12px_rgba(134,239,172,0.7)]" />
            Live court
          </div>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => applyScenario(scenario)}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition ${
                  activeScenario === scenario.id
                    ? "border-green-300/45 bg-green-400/15 text-green-100"
                    : "border-white/10 bg-white/[0.06] text-slate-200 hover:border-green-300/40 hover:bg-green-400/10 hover:text-white"
                }`}
              >
                <Crosshair className="size-4" />
                {scenario.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                setDefenderCount((current) => (current === 1 ? 2 : 1))
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-sky-300/25 bg-sky-500/10 px-3 py-2 text-sm font-bold text-sky-100 transition hover:border-sky-300/55 hover:bg-sky-500/20"
            >
              <Users className="size-4" />
              {defenderCount} Defender{defenderCount > 1 ? "s" : ""}
            </button>
            <button
              type="button"
              onClick={() => setShowCourtLines((value) => !value)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-green-300/40 hover:bg-green-400/10 hover:text-white"
            >
              {showCourtLines ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
              {showCourtLines ? "Hide Lines" : "Show Lines"}
            </button>
            <button
              type="button"
              onClick={resetPositions}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-orange-300/25 bg-orange-500/10 px-3 py-2 text-sm font-bold text-orange-100 transition hover:border-orange-300/55 hover:bg-orange-500/20"
            >
              <RotateCcw className="size-4" />
              Reset Positions
            </button>
          </div>
        </div>

        <div className="mb-4 grid gap-3 text-sm md:grid-cols-3">
          <StatusChip
            icon={<Layers className="size-4" />}
            label="Preset"
            value={
              SCENARIOS.find((scenario) => scenario.id === activeScenario)
                ?.label ?? "Custom"
            }
          />
          <StatusChip
            icon={<Crosshair className="size-4" />}
            label="Zone"
            value={stats.shotZone}
          />
          <StatusChip
            icon={<Users className="size-4" />}
            label="Pressure"
            value={stats.defenderPressure}
          />
        </div>

        <SandboxCourt
          defenders={activeDefenders}
          onDefenderMove={handleDefenderMove}
          onShooterMove={(point) => {
            setShooter(point);
            setActiveScenario("custom");
          }}
          showLines={showCourtLines}
          shooter={shooter}
          stats={stats}
        />
      </section>

      <StatsPanel stats={stats} />
    </motion.div>
  );
}

function StatusChip({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-lg border border-white/10 bg-black/25 px-4 py-3">
      <span className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-orange-100">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>
        <p className="truncate font-black text-white">{value}</p>
      </div>
    </div>
  );
}
