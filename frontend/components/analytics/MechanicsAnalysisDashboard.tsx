"use client";

import { Activity, Award, Gauge, Wrench } from "lucide-react";
import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Tooltip,
} from "recharts";
import { AnalyticsCard, ChartContainer, ExportChartButton, StatCard } from "@/components/charts";
import { GlobalAnalyticsFilterBar } from "@/components/analytics/GlobalAnalyticsFilterBar";
import { formatScore } from "@/lib/analytics/formatters";
import { buildMechanicsAnalytics } from "@/lib/analytics/transforms";
import { useFilteredAnalyticsShots } from "@/lib/analytics/useFilteredAnalyticsShots";
import type { MechanicsDatum } from "@/types/charts";

export function MechanicsAnalysisDashboard() {
  const shots = useFilteredAnalyticsShots();
  const mechanicsRows = useMemo(() => buildMechanicsAnalytics(shots), [shots]);
  const overallScore = average(mechanicsRows.map((row) => row.score));
  const bestCategory = pickCategory(mechanicsRows, "best");
  const weakestCategory = pickCategory(mechanicsRows, "weakest");
  const suggestions = buildSuggestions(mechanicsRows);

  return (
    <section className="grid gap-6">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">
          Mechanics Analytics
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
          Shooting mechanics dashboard
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          Turn simulator pose scoring into a mechanics profile across balance,
          footwork, release, jump timing, alignment, contest handling, and landing.
        </p>
      </header>

      <GlobalAnalyticsFilterBar />

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard icon={<Gauge className="size-5" />} label="Overall Mechanics" value={formatScore(overallScore)} tone="green" />
        <StatCard icon={<Award className="size-5" />} label="Best Category" value={bestCategory?.metric ?? "No data"} tone="orange" />
        <StatCard icon={<Wrench className="size-5" />} label="Weakest Category" value={weakestCategory?.metric ?? "No data"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <AnalyticsCard
          action={<ExportChartButton data={mechanicsRows} filename="shotoptix-mechanics-analysis" />}
          eyebrow="Radar Chart"
          title="Mechanics category profile"
        >
          <ChartContainer empty={!shots.length} height={430}>
            <RadarChart data={mechanicsRows} outerRadius={148}>
              <PolarGrid stroke="rgba(255,255,255,0.12)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#cbd5e1", fontSize: 12, fontWeight: 800 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip content={<MechanicsTooltip />} />
              <Radar
                dataKey="score"
                fill="#22c55e"
                fillOpacity={0.28}
                name="Score"
                stroke="#86efac"
                strokeWidth={3}
              />
            </RadarChart>
          </ChartContainer>
        </AnalyticsCard>

        <AnalyticsCard eyebrow="Coach Notes" title="Improvement suggestions">
          <div className="grid gap-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion}
                className="flex gap-3 rounded-lg border border-white/10 bg-black/30 p-3"
              >
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-orange-300/25 bg-orange-500/10 text-orange-100">
                  <Activity className="size-4" />
                </span>
                <p className="text-sm leading-6 text-slate-300">{suggestion}</p>
              </div>
            ))}
          </div>
        </AnalyticsCard>
      </div>
    </section>
  );
}

function MechanicsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: MechanicsDatum }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-[#090909]/95 p-3 text-sm shadow-2xl">
      <p className="font-black text-white">{row.metric}</p>
      <p className="mt-1 text-xs font-bold text-slate-300">Score: {formatScore(row.score)}</p>
    </div>
  );
}

function buildSuggestions(rows: MechanicsDatum[]) {
  const lowRows = rows.filter((row) => row.score > 0 && row.score < 72);

  if (!rows.some((row) => row.score > 0)) {
    return ["Save simulator replays to generate personalized mechanics suggestions."];
  }

  if (!lowRows.length) {
    return [
      "Mechanics profile is balanced; preserve the current rhythm under tighter pressure.",
      "Use the optimizer comparison to test whether a cleaner shot context adds more EPPS.",
    ];
  }

  return lowRows.slice(0, 4).map((row) => {
    // Suggestions stay category-specific without pretending to be biomechanical diagnosis.
    if (row.metric === "Release") {
      return "Stabilize release angle and hand height before adding range.";
    }

    if (row.metric === "Footwork") {
      return "Square the feet earlier so the jumper starts from a repeatable base.";
    }

    if (row.metric === "Contest Handling") {
      return "Create more space before the gather or speed up the release window.";
    }

    if (row.metric === "Landing") {
      return "Finish vertically and keep leg drift controlled after release.";
    }

    return `Prioritize ${row.metric.toLowerCase()} in the next simulator session.`;
  });
}

function pickCategory(rows: MechanicsDatum[], mode: "best" | "weakest") {
  const scoredRows = rows.filter((row) => row.score > 0);

  if (!scoredRows.length) {
    return null;
  }

  return scoredRows.reduce((selected, row) =>
    mode === "best"
      ? row.score > selected.score
        ? row
        : selected
      : row.score < selected.score
        ? row
        : selected,
  );
}

function average(values: number[]) {
  const validValues = values.filter(Number.isFinite);

  if (!validValues.length) {
    return 0;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}
