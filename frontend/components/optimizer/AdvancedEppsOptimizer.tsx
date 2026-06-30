"use client";

import {
  Activity,
  ArrowUpRight,
  Gauge,
  Info,
  Shield,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  useShotStore,
  type SharedPressureLevel,
  type SharedShotQuality,
} from "@/store/useShotStore";

type OptimizerPressure =
  | "Very Tight"
  | "Tight"
  | "Moderate"
  | "Open"
  | "Very Open";

type ShotOption = {
  coachingReason: string;
  epps: number;
  id: string;
  makeProbability: number;
  pressureLevel: OptimizerPressure;
  shotQuality: SharedShotQuality;
  shotValue: 2 | 3;
  title: string;
};

export function AdvancedEppsOptimizer() {
  const shotDistance = useShotStore((state) => state.shotDistance);
  const shotQuality = useShotStore((state) => state.shotQuality);
  const shotValue = useShotStore((state) => state.shotValue);
  const shotZone = useShotStore((state) => state.shotZone);
  const makeProbability = useShotStore((state) => state.makeProbability);
  const epps = useShotStore((state) => state.epps);
  const pressureLevel = useShotStore((state) => state.pressureLevel);
  const currentShot = useMemo(
    () =>
      normalizeCurrentShot({
        epps,
        makeProbability,
        pressureLevel,
        shotQuality,
        shotValue,
        title: `${pressureLevel} ${shotZone}`,
      }),
    [epps, makeProbability, pressureLevel, shotQuality, shotValue, shotZone],
  );
  const alternatives = useMemo(
    () =>
      generateShotAlternatives({
        current: currentShot,
        shotDistance,
        shotZone,
      }),
    [currentShot, shotDistance, shotZone],
  );
  const bestAlternative = alternatives.reduce((best, option) =>
    option.epps > best.epps ? option : best,
  );
  const eppsGain = bestAlternative.epps - currentShot.epps;

  return (
    <section className="grid gap-6">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">
          Phase 5 Optimizer
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
          Advanced EPPS Optimizer
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          Compare the current possession against practical alternatives. This is
          an optimization assistant for decision support, not a guaranteed shot
          outcome.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
        <ShotSummaryCard
          option={currentShot}
          eyebrow="Current shot card"
          icon={<Target className="size-5" />}
          tone="neutral"
        />
        <ShotSummaryCard
          option={bestAlternative}
          eyebrow="Best alternative card"
          icon={<ArrowUpRight className="size-5" />}
          tone="green"
        />
        <GainCard eppsGain={eppsGain} />
      </div>

      <section className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.26)]">
        <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Shot Alternatives
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              Recommended: {bestAlternative.title}
            </h2>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-md border border-green-300/25 bg-green-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-green-100">
            <Gauge className="size-3.5" />
            +{Math.max(0, eppsGain).toFixed(2)} EPPS gain
          </span>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-5">
          {alternatives.map((option) => (
            <AlternativeCard
              key={option.id}
              currentEpps={currentShot.epps}
              isBest={option.id === bestAlternative.id}
              option={option}
            />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-orange-300/20 bg-orange-500/10 p-4">
        <div className="flex gap-3">
          <Info className="mt-1 size-5 shrink-0 text-orange-200" />
          <div>
            <p className="text-sm font-black text-orange-100">
              Coaching reason
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-200">
              {bestAlternative.coachingReason}{" "}
              {eppsGain > 0
                ? `The expected gain is +${eppsGain.toFixed(2)} EPPS compared with the current look.`
                : "The current look is competitive with the generated alternatives."}
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}

function ShotSummaryCard({
  eyebrow,
  icon,
  option,
  tone,
}: {
  eyebrow: string;
  icon: ReactNode;
  option: ShotOption;
  tone: "green" | "neutral";
}) {
  return (
    <article className={`rounded-lg border p-4 ${summaryToneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-black text-white">{option.title}</h2>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-current/25 bg-black/20">
          {icon}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatPill label="Make probability" value={`${(option.makeProbability * 100).toFixed(1)}%`} />
        <StatPill label="Shot value" value={`${option.shotValue} pts`} />
        <StatPill label="EPPS" value={option.epps.toFixed(2)} />
        <StatPill label="Quality" value={option.shotQuality} />
      </div>
    </article>
  );
}

function GainCard({ eppsGain }: { eppsGain: number }) {
  return (
    <article className="rounded-lg border border-white/10 bg-black/30 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        EPPS Gain
      </p>
      <p className={`mt-2 text-4xl font-black ${eppsGain >= 0 ? "text-green-200" : "text-red-200"}`}>
        {eppsGain >= 0 ? "+" : ""}
        {eppsGain.toFixed(2)}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Useful EPPS compares expected points with pressure and shot value, then
        highlights the best available decision.
      </p>
    </article>
  );
}

function AlternativeCard({
  currentEpps,
  isBest,
  option,
}: {
  currentEpps: number;
  isBest: boolean;
  option: ShotOption;
}) {
  const gain = option.epps - currentEpps;

  return (
    <article
      className={`rounded-lg border p-4 transition ${
        isBest
          ? "border-green-300/40 bg-green-400/10 shadow-[0_18px_60px_rgba(34,197,94,0.16)]"
          : "border-white/10 bg-black/25"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-black text-white">{option.title}</h3>
        {isBest ? (
          <span className="rounded-md border border-green-300/35 bg-green-400/15 px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-green-100">
            Best
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-2">
        <MiniStat icon={<Activity className="size-3.5" />} label="EPPS" value={option.epps.toFixed(2)} />
        <MiniStat icon={<Target className="size-3.5" />} label="P(make)" value={`${(option.makeProbability * 100).toFixed(1)}%`} />
        <MiniStat icon={<Shield className="size-3.5" />} label="Pressure" value={option.pressureLevel} />
        <MiniStat icon={<Gauge className="size-3.5" />} label="Gain" value={`${gain >= 0 ? "+" : ""}${gain.toFixed(2)}`} />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">
        {option.coachingReason}
      </p>
    </article>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
        {icon}
        {label}
      </span>
      <span className="truncate text-xs font-black text-white">{value}</span>
    </div>
  );
}

function normalizeCurrentShot({
  epps,
  makeProbability,
  pressureLevel,
  shotQuality,
  shotValue,
  title,
}: {
  epps: number;
  makeProbability: number;
  pressureLevel: SharedPressureLevel;
  shotQuality: SharedShotQuality;
  shotValue: 2 | 3;
  title: string;
}): ShotOption {
  // Empty persisted metric state can appear before sandbox analytics run, so
  // the optimizer gives the current shot a conservative explainable baseline.
  const normalizedProbability =
    makeProbability > 0 ? makeProbability : shotValue === 3 ? 0.34 : 0.42;
  const normalizedEpps = epps > 0 ? epps : normalizedProbability * shotValue;

  return {
    coachingReason:
      "This is the current shot context from the shared ShotOptix store.",
    epps: normalizedEpps,
    id: "current",
    makeProbability: normalizedProbability,
    pressureLevel,
    shotQuality: epps > 0 ? shotQuality : getShotQuality(normalizedEpps),
    shotValue,
    title,
  };
}

function generateShotAlternatives({
  current,
  shotDistance,
  shotZone,
}: {
  current: ShotOption;
  shotDistance: number;
  shotZone: string;
}) {
  // Alternatives are lightweight estimates for explanation. They reuse the
  // current shot context but do not override or replace the backend ML model.
  const currentPressurePenalty = getPressurePenalty(current.pressureLevel);
  const distancePenalty = Math.max(0, shotDistance - 24) * 0.004;
  const isCurrentMidRange = shotZone === "Mid-Range";

  return [
    buildOption({
      baseProbability: 0.37 - distancePenalty + currentPressurePenalty * 0.35,
      coachingReason:
        "Step back creates space and converts the attempt into a higher-value three.",
      id: "step-back-three",
      pressureLevel: easePressure(current.pressureLevel),
      shotValue: 3,
      title: "Step back three",
    }),
    buildOption({
      baseProbability: 0.415 + currentPressurePenalty * 0.42,
      coachingReason:
        "Corner spacing raises shot value while reducing the defender pressure angle.",
      id: "corner-three",
      pressureLevel: "Open",
      shotValue: 3,
      title: "Corner three",
    }),
    buildOption({
      baseProbability: 0.61 - (isCurrentMidRange ? 0.02 : 0) - currentPressurePenalty * 0.2,
      coachingReason:
        "Paint attack trades distance for rim pressure and a stronger two-point make rate.",
      id: "paint-attack",
      pressureLevel: current.pressureLevel === "Very Tight" ? "Tight" : "Moderate",
      shotValue: 2,
      title: "Paint attack",
    }),
    buildOption({
      baseProbability: current.makeProbability + 0.075 + currentPressurePenalty * 0.28,
      coachingReason:
        "Creating more space keeps the same shot family but improves the release window.",
      id: "create-more-space",
      pressureLevel: easePressure(current.pressureLevel),
      shotValue: current.shotValue,
      title: "Create more space",
    }),
    buildOption({
      baseProbability: current.shotValue === 3 ? 0.39 : 0.53,
      coachingReason:
        "Passing or resetting avoids forcing the current look and hunts a cleaner possession.",
      id: "pass-reset",
      pressureLevel: "Very Open",
      shotValue: current.shotValue === 3 ? 3 : 2,
      title: "Pass/reset possession",
    }),
  ];
}

function buildOption({
  baseProbability,
  coachingReason,
  id,
  pressureLevel,
  shotValue,
  title,
}: {
  baseProbability: number;
  coachingReason: string;
  id: string;
  pressureLevel: OptimizerPressure;
  shotValue: 2 | 3;
  title: string;
}): ShotOption {
  const pressureAdjustedProbability = clamp(
    baseProbability - getPressurePenalty(pressureLevel),
    shotValue === 3 ? 0.27 : 0.38,
    shotValue === 3 ? 0.47 : 0.72,
  );
  const epps = pressureAdjustedProbability * shotValue;

  return {
    coachingReason,
    epps,
    id,
    makeProbability: pressureAdjustedProbability,
    pressureLevel,
    shotQuality: getShotQuality(epps),
    shotValue,
    title,
  };
}

function easePressure(pressure: OptimizerPressure): OptimizerPressure {
  if (pressure === "Very Tight") {
    return "Tight";
  }

  if (pressure === "Tight") {
    return "Moderate";
  }

  if (pressure === "Moderate") {
    return "Open";
  }

  return "Very Open";
}

function getPressurePenalty(pressure: OptimizerPressure) {
  if (pressure === "Very Tight") {
    return 0.16;
  }

  if (pressure === "Tight") {
    return 0.1;
  }

  if (pressure === "Moderate") {
    return 0.05;
  }

  if (pressure === "Open") {
    return 0.02;
  }

  return 0;
}

function getShotQuality(epps: number): SharedShotQuality {
  if (epps >= 1.25) {
    return "Excellent";
  }

  if (epps >= 1.05) {
    return "Good";
  }

  if (epps >= 0.85) {
    return "Average";
  }

  if (epps >= 0.68) {
    return "Poor";
  }

  return "Bad";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const summaryToneClasses = {
  green: "border-green-300/30 bg-green-400/10 text-green-100",
  neutral: "border-white/10 bg-white/[0.045] text-slate-200",
};
