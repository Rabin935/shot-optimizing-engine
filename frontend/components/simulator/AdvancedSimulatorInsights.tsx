"use client";

import {
  Activity,
  BrainCircuit,
  Layers,
  Route,
  Shield,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  PLAYER_PROFILES,
  applyFatigue,
  buildSessionReport,
  compareToProfile,
  evaluatePossession,
  explainPrediction,
  generateVirtualCoach,
  getDefenderAIPositions,
  getFatiguePenalty,
  runWhatIfScenario,
  type DefenderAIMode,
  type PossessionStep,
  type WhatIfInput,
} from "@/lib/session-insights";
import { useShotStore } from "@/store/useShotStore";

const DEFENDER_AI_MODES: DefenderAIMode[] = [
  "Help Defense",
  "Late Closeout",
  "Switch",
  "Double Team",
  "Drop Coverage",
  "Blitz",
];

const POSSESSION_STEPS: PossessionStep[] = [
  "Catch",
  "Dribble",
  "Screen",
  "Drive",
  "Kick Out",
  "Shoot",
];

export function AdvancedSimulatorInsights() {
  const activeDefenderCount = useShotStore((state) => state.activeDefenderCount);
  const closestDefenderDistance = useShotStore(
    (state) => state.closestDefenderDistance,
  );
  const defenders = useShotStore((state) => state.defenders);
  const epps = useShotStore((state) => state.epps);
  const makeProbability = useShotStore((state) => state.makeProbability);
  const pressureLevel = useShotStore((state) => state.pressureLevel);
  const replayHistory = useShotStore((state) => state.replayHistory);
  const shooter = useShotStore((state) => state.shooter);
  const shooterPose = useShotStore((state) => state.shooterPose);
  const shotDistance = useShotStore((state) => state.shotDistance);
  const shotValue = useShotStore((state) => state.shotValue);
  const shotZone = useShotStore((state) => state.shotZone);
  const setDefenderCount = useShotStore((state) => state.setDefenderCount);
  const setDefenderPosition = useShotStore((state) => state.setDefenderPosition);
  const updatePredictionResult = useShotStore(
    (state) => state.updatePredictionResult,
  );
  const updateShooterPose = useShotStore((state) => state.updateShooterPose);
  const [selectedProfileId, setSelectedProfileId] = useState(PLAYER_PROFILES[0].id);
  const [fatigueShotCount, setFatigueShotCount] = useState(42);
  const [whatIf, setWhatIf] = useState<WhatIfInput>({
    defenderFeetFarther: 2,
    releaseAngleDelta: 5,
    shooterXDelta: -1,
    useSingleDefender: false,
  });
  const [possessionSteps, setPossessionSteps] = useState<PossessionStep[]>([
    "Catch",
    "Screen",
    "Kick Out",
    "Shoot",
  ]);
  const report = useMemo(
    () => buildSessionReport(replayHistory),
    [replayHistory],
  );
  const selectedProfile =
    PLAYER_PROFILES.find((profile) => profile.id === selectedProfileId) ??
    PLAYER_PROFILES[0];
  const profileComparison = useMemo(
    () => compareToProfile({ profile: selectedProfile, shooterPose }),
    [selectedProfile, shooterPose],
  );
  const coachLines = useMemo(
    () =>
      generateVirtualCoach({
        profile: selectedProfile,
        replays: replayHistory,
        report,
      }),
    [replayHistory, report, selectedProfile],
  );
  const possession = useMemo(
    () =>
      evaluatePossession({
        baseEpps: epps,
        steps: possessionSteps,
      }),
    [epps, possessionSteps],
  );
  const explanationFactors = explainPrediction({
    metrics: {
      closestDefenderDistance,
      epps,
      makeProbability,
      pressureLevel,
      shotDistance,
      shotValue,
      shotZone,
    },
  });
  const whatIfResult = useMemo(
    () =>
      runWhatIfScenario({
        activeDefenderCount,
        defenders,
        input: whatIf,
        shooter,
      }),
    [activeDefenderCount, defenders, shooter, whatIf],
  );

  function applyProfile() {
    updateShooterPose(selectedProfile.baseline, "simulator");
  }

  function applyFatigueSimulation() {
    const fatiguedPose = applyFatigue({
      possessionIndex: fatigueShotCount,
      shooterPose,
    });
    const penalty = getFatiguePenalty(fatigueShotCount);
    const nextProbability = Math.max(0.08, makeProbability - penalty);

    updateShooterPose(fatiguedPose, "simulator");
    updatePredictionResult(
      {
        epps: nextProbability * shotValue,
        makeProbability: nextProbability,
        recommendation:
          "Fatigue simulation applied: expect lower lift, slower release, and reduced EPPS.",
      },
      "simulator",
    );
  }

  function applyDefenderAI(mode: DefenderAIMode) {
    const nextDefenders = getDefenderAIPositions({ defenders, mode, shooter });

    setDefenderCount(nextDefenders.length > 1 ? 2 : 1, "simulator");
    nextDefenders.forEach((defender) =>
      setDefenderPosition(defender.id, defender, "simulator"),
    );
  }

  function togglePossessionStep(step: PossessionStep) {
    setPossessionSteps((current) =>
      current.includes(step)
        ? current.filter((item) => item !== step)
        : [...current, step],
    );
  }

  return (
    <section className="grid gap-4">
      <SessionAnalysisPanel report={report} />

      <Panel
        icon={<BrainCircuit className="size-4" />}
        eyebrow="AI Virtual Coach"
        title="Personalized session coaching"
      >
        <div className="grid gap-2">
          {coachLines.map((line) => (
            <p
              key={line}
              className="rounded-lg border border-white/10 bg-black/25 p-3 text-sm leading-6 text-slate-200"
            >
              {line}
            </p>
          ))}
        </div>
      </Panel>

      <Panel
        icon={<User className="size-4" />}
        eyebrow="Player Profiles"
        title="Compare against elite baselines"
      >
        <div className="grid gap-3">
          <select
            value={selectedProfileId}
            onChange={(event) => setSelectedProfileId(event.target.value)}
            className="min-h-10 rounded-lg border border-white/10 bg-black/35 px-3 text-sm font-bold text-white outline-none"
          >
            {PLAYER_PROFILES.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
          <div className="grid gap-2">
            <InfoRow label="Similarity" value={`${profileComparison.similarity}%`} />
            <InfoRow
              label="Release Delta"
              value={`${profileComparison.releaseDelta.toFixed(1)} deg`}
            />
            <InfoRow
              label="Jump Delta"
              value={profileComparison.jumpDelta.toFixed(1)}
            />
            <InfoRow
              label="Release Point"
              value={profileComparison.handHeightDelta.toFixed(1)}
            />
          </div>
          <button
            type="button"
            onClick={applyProfile}
            className="min-h-10 rounded-lg border border-sky-300/25 bg-sky-400/10 px-3 text-xs font-black text-sky-100 transition hover:bg-sky-400/20"
          >
            Apply Profile Mechanics
          </button>
        </div>
      </Panel>

      <Panel
        icon={<Activity className="size-4" />}
        eyebrow="Fatigue Simulation"
        title="Session load impact"
      >
        <label className="grid gap-2">
          <span className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            <span>Shot count</span>
            <span>{fatigueShotCount}</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={fatigueShotCount}
            onChange={(event) => setFatigueShotCount(Number(event.target.value))}
            className="h-2 w-full accent-orange-400"
          />
        </label>
        <button
          type="button"
          onClick={applyFatigueSimulation}
          className="mt-3 min-h-10 w-full rounded-lg border border-orange-300/25 bg-orange-500/10 px-3 text-xs font-black text-orange-100 transition hover:bg-orange-500/20"
        >
          Apply Fatigue
        </button>
      </Panel>

      <Panel
        icon={<Shield className="size-4" />}
        eyebrow="Defender AI"
        title="Automatic defensive reactions"
      >
        <div className="grid grid-cols-2 gap-2">
          {DEFENDER_AI_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => applyDefenderAI(mode)}
              className="min-h-10 rounded-lg border border-white/10 bg-white/[0.045] px-2 text-xs font-black text-slate-200 transition hover:border-green-300/35 hover:text-green-100"
            >
              {mode}
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        icon={<Route className="size-4" />}
        eyebrow="Possession Simulator"
        title="Evaluate full action chains"
      >
        <div className="grid grid-cols-3 gap-2">
          {POSSESSION_STEPS.map((step) => (
            <button
              key={step}
              type="button"
              aria-pressed={possessionSteps.includes(step)}
              onClick={() => togglePossessionStep(step)}
              className={`min-h-10 rounded-lg border px-2 text-xs font-black transition ${
                possessionSteps.includes(step)
                  ? "border-green-300/35 bg-green-400/15 text-green-100"
                  : "border-white/10 bg-white/[0.045] text-slate-400"
              }`}
            >
              {step}
            </button>
          ))}
        </div>
        <InfoRow label="Possession EPPS" value={possession.epps.toFixed(2)} />
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {possession.explanation}
        </p>
      </Panel>

      <Panel
        icon={<Sparkles className="size-4" />}
        eyebrow="Explainable AI"
        title="Prediction transparency"
      >
        <InfoRow label="Probability" value={`${(makeProbability * 100).toFixed(1)}%`} />
        <div className="mt-2 grid gap-2">
          {explanationFactors.map((factor) => (
            <div
              key={`${factor.label}-${factor.value}`}
              className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                factor.polarity === "positive"
                  ? "border-green-300/20 bg-green-400/10 text-green-100"
                  : "border-red-300/20 bg-red-500/10 text-red-100"
              }`}
            >
              {factor.polarity === "positive" ? "+ " : "- "}
              {factor.label}
            </div>
          ))}
        </div>
        <InfoRow label="Final EPPS" value={epps.toFixed(2)} />
      </Panel>

      <Panel
        icon={<Layers className="size-4" />}
        eyebrow="What-If Analysis"
        title="Instant scenario recalculation"
      >
        <WhatIfSlider
          label="Defender farther"
          max={8}
          min={-4}
          unit="ft"
          value={whatIf.defenderFeetFarther}
          onChange={(defenderFeetFarther) =>
            setWhatIf((current) => ({ ...current, defenderFeetFarther }))
          }
        />
        <WhatIfSlider
          label="Release angle"
          max={12}
          min={-12}
          unit="deg"
          value={whatIf.releaseAngleDelta}
          onChange={(releaseAngleDelta) =>
            setWhatIf((current) => ({ ...current, releaseAngleDelta }))
          }
        />
        <WhatIfSlider
          label="Shooter left/right"
          max={5}
          min={-5}
          unit="ft"
          value={whatIf.shooterXDelta}
          onChange={(shooterXDelta) =>
            setWhatIf((current) => ({ ...current, shooterXDelta }))
          }
        />
        <button
          type="button"
          aria-pressed={whatIf.useSingleDefender}
          onClick={() =>
            setWhatIf((current) => ({
              ...current,
              useSingleDefender: !current.useSingleDefender,
            }))
          }
          className="min-h-10 rounded-lg border border-white/10 bg-white/[0.045] px-3 text-xs font-black text-slate-200"
        >
          {whatIf.useSingleDefender ? "One Defender" : "Current Defenders"}
        </button>
        <InfoRow
          label="What-if EPPS"
          value={`${whatIfResult.epps.toFixed(2)} / ${(whatIfResult.makeProbability * 100).toFixed(1)}%`}
        />
      </Panel>
    </section>
  );
}

function SessionAnalysisPanel({ report }: { report: ReturnType<typeof buildSessionReport> }) {
  return (
    <Panel
      icon={<TrendingUp className="size-4" />}
      eyebrow="Session Analysis"
      title="Training session report"
    >
      <div className="grid gap-2">
        <InfoRow label="Shots" value={String(report.shotCount)} />
        <InfoRow label="Average EPPS" value={report.averageEpps.toFixed(2)} />
        <InfoRow
          label="Average Release"
          value={`${report.averageReleaseAngle.toFixed(1)} deg`}
        />
        <InfoRow label="Average Contest" value={`${report.averageContest.toFixed(1)} ft`} />
        <InfoRow label="Average Jump" value={report.averageJumpHeight.toFixed(1)} />
        <InfoRow label="Best Zone" value={report.bestZone} />
        <InfoRow label="Worst Zone" value={report.worstZone} />
        <InfoRow label="Mechanics Trend" value={report.mechanicsTrend} />
      </div>
    </Panel>
  );
}

function Panel({
  children,
  eyebrow,
  icon,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-black/30 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-green-300/20 bg-green-400/10 text-green-100">
          {icon}
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-sm font-black text-white">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <span className="truncate text-sm font-black text-white">{value}</span>
    </div>
  );
}

function WhatIfSlider({
  label,
  max,
  min,
  onChange,
  unit,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  unit: string;
  value: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
        <span>{label}</span>
        <span>
          {value > 0 ? "+" : ""}
          {value} {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full accent-green-300"
      />
    </label>
  );
}
