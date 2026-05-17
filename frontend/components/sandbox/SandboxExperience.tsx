"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
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

export function SandboxExperience() {
  const [shooter, setShooter] = useState<CourtPoint>(INITIAL_SHOOTER);
  const [defenders, setDefenders] =
    useState<SandboxDefender[]>(INITIAL_DEFENDERS);
  const [showCourtLines, setShowCourtLines] = useState(true);
  const stats = useMemo(
    () => calculateSandboxStats(shooter, defenders),
    [defenders, shooter],
  );

  const handleDefenderMove = (id: string, point: CourtPoint) => {
    setDefenders((current) =>
      current.map((defender) =>
        defender.id === id ? { ...defender, point } : defender,
      ),
    );
  };

  const resetPositions = () => {
    setShooter(INITIAL_SHOOTER);
    setDefenders(INITIAL_DEFENDERS);
  };

  return (
    <motion.div
      className="grid gap-6 lg:grid-cols-[minmax(0,0.73fr)_minmax(280px,0.27fr)]"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <section className="min-w-0 rounded-lg border border-white/10 bg-white/[0.035] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.38)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
            <span className="h-2 w-2 rounded-full bg-green-300 shadow-[0_0_12px_rgba(134,239,172,0.7)]" />
            Live court
          </div>
          <div className="flex flex-wrap gap-2">
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

        <SandboxCourt
          defenders={defenders}
          onDefenderMove={handleDefenderMove}
          onShooterMove={setShooter}
          showLines={showCourtLines}
          shooter={shooter}
          stats={stats}
        />
      </section>

      <StatsPanel stats={stats} />
    </motion.div>
  );
}
