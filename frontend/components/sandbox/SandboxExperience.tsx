"use client";

import { useMemo, useState } from "react";
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

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.73fr)_minmax(280px,0.27fr)]">
      <section className="min-w-0 rounded-lg border border-white/10 bg-white/[0.035] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.38)] sm:p-5">
        <SandboxCourt
          defenders={defenders}
          onDefenderMove={handleDefenderMove}
          onShooterMove={setShooter}
          shooter={shooter}
          stats={stats}
        />
      </section>

      <StatsPanel stats={stats} />
    </div>
  );
}
