"use client";

import { BarChart3, Flame, Gauge, Target, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { buildResearchSummary } from "@/lib/session-insights";
import { useShotStore } from "@/store/useShotStore";

export function ResearchDashboard() {
  const replayHistory = useShotStore((state) => state.replayHistory);
  const summary = buildResearchSummary(replayHistory);

  return (
    <section className="grid gap-6">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">
          Research Dashboard
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
          Simulation research summary
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          Aggregate every saved replay into thesis-friendly metrics, trends,
          distributions, and shot-location evidence.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Target className="size-5" />} label="Simulations" value={String(summary.shotCount)} />
        <MetricCard icon={<Gauge className="size-5" />} label="Average EPPS" value={summary.averageEpps.toFixed(2)} />
        <MetricCard icon={<TrendingUp className="size-5" />} label="Average Make" value={`${(summary.averageMakeProbability * 100).toFixed(1)}%`} />
        <MetricCard icon={<Flame className="size-5" />} label="Pressure Mode" value={summary.pressureMode} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <span className="grid size-10 place-items-center rounded-lg border border-green-300/20 bg-green-400/10 text-green-100">
              <BarChart3 className="size-4" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Trend Charts
              </p>
              <h2 className="text-lg font-black text-white">Replay EPPS over time</h2>
            </div>
          </div>
          <div className="mt-5 flex h-72 items-end gap-2 rounded-lg border border-white/10 bg-black/25 p-4">
            {replayHistory.length ? (
              [...replayHistory].reverse().map((replay, index) => (
                <div
                  key={replay.id}
                  className="flex flex-1 flex-col items-center justify-end gap-2"
                >
                  <div
                    className="w-full rounded-t bg-green-300"
                    style={{ height: `${Math.max(8, replay.metrics.epps * 105)}px` }}
                  />
                  <span className="text-[10px] font-black text-slate-500">
                    {index + 1}
                  </span>
                </div>
              ))
            ) : (
              <p className="self-center text-sm text-slate-400">
                Save simulator replays to populate session trends.
              </p>
            )}
          </div>
        </section>

        <aside className="grid gap-4">
          <Panel title="Best and Worst Zones">
            <InfoRow label="Best Zone" value={summary.bestZone} />
            <InfoRow label="Worst Zone" value={summary.worstZone} />
            <InfoRow label="Mechanics Trend" value={summary.mechanicsTrend} />
          </Panel>

          <Panel title="Pose Score Distribution">
            <ScoreBar label="Elite" value={summary.scoreBuckets.elite} total={summary.shotCount} />
            <ScoreBar label="Good" value={summary.scoreBuckets.good} total={summary.shotCount} />
            <ScoreBar label="Needs Work" value={summary.scoreBuckets.needsWork} total={summary.shotCount} />
          </Panel>

          <Panel title="Heatmap Evidence">
            <div className="relative h-52 rounded-lg border border-white/10 bg-[#10160f]">
              {summary.heatmapShots.map((shot, index) => (
                <span
                  key={`${shot.x}-${shot.y}-${index}`}
                  className="absolute size-3 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(251,146,60,0.8)]"
                  style={{
                    left: `${(shot.x / 50) * 100}%`,
                    top: `${(shot.y / 47) * 100}%`,
                  }}
                  title={`${shot.zone}: ${shot.epps.toFixed(2)} EPPS`}
                />
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
      <span className="grid size-11 place-items-center rounded-lg border border-orange-300/25 bg-orange-500/10 text-orange-100">
        {icon}
      </span>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </article>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-white/10 bg-black/30 p-4">
      <h3 className="text-sm font-black text-white">{title}</h3>
      <div className="mt-3 grid gap-2">{children}</div>
    </section>
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

function ScoreBar({
  label,
  total,
  value,
}: {
  label: string;
  total: number;
  value: number;
}) {
  const percent = total ? (value / total) * 100 : 0;

  return (
    <div className="grid gap-2">
      <div className="flex justify-between text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-green-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
