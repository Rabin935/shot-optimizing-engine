"use client";

import { Activity, RotateCcw, Shield, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import {
  useShotStore,
  type ActiveDefenderCount,
  type DefenderPoseState,
} from "@/store/useShotStore";

const FALLBACK_DEFENDER_POSE: DefenderPoseState = {
  armRaise: 64,
  contestHeight: 8.8,
  isAirborne: false,
  jumpHeight: 0,
  kneeBend: 18,
  leanAngle: 0,
  stanceWidth: 2.8,
  torsoAngle: 0,
  verticalOffset: 0,
};

export function SimulatorStateControls() {
  // This page edits the same Zustand shot state that /sandbox reads.
  const shooter = useShotStore((state) => state.shooter);
  const defenders = useShotStore((state) => state.defenders);
  const activeDefenderCount = useShotStore(
    (state) => state.activeDefenderCount,
  );
  const shooterPose = useShotStore((state) => state.shooterPose);
  const defenderPoses = useShotStore((state) => state.defenderPoses);
  const shotDistance = useShotStore((state) => state.shotDistance);
  const shotZone = useShotStore((state) => state.shotZone);
  const pressureLevel = useShotStore((state) => state.pressureLevel);
  const epps = useShotStore((state) => state.epps);
  const predictionSource = useShotStore((state) => state.predictionSource);
  const setShooterPosition = useShotStore((state) => state.setShooterPosition);
  const setDefenderPosition = useShotStore((state) => state.setDefenderPosition);
  const setDefenderCount = useShotStore((state) => state.setDefenderCount);
  const updateShooterPose = useShotStore((state) => state.updateShooterPose);
  const updateDefenderPose = useShotStore((state) => state.updateDefenderPose);
  const resetShot = useShotStore((state) => state.resetShot);
  const resetPoses = useShotStore((state) => state.resetPoses);
  const primaryDefender = defenders[0];
  const primaryDefenderPose =
    defenderPoses[primaryDefender?.id ?? "d1"] ?? FALLBACK_DEFENDER_POSE;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:p-5">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 place-items-center rounded-lg border border-orange-300/25 bg-orange-500/10 text-orange-100">
              <Activity className="size-5" />
            </span>
            <div>
              <p className="text-sm font-black text-white">
                Shared Simulator State
              </p>
              <p className="text-xs text-slate-400">
                {shotZone} / {pressureLevel}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => resetShot("simulator")}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-orange-300/25 bg-orange-500/10 px-3 py-2 text-sm font-bold text-orange-100 transition hover:border-orange-300/55 hover:bg-orange-500/20"
            >
              <RotateCcw className="size-4" />
              Reset Shot
            </button>
            <button
              type="button"
              onClick={() => resetPoses("simulator")}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-sky-300/25 bg-sky-500/10 px-3 py-2 text-sm font-bold text-sky-100 transition hover:border-sky-300/55 hover:bg-sky-500/20"
            >
              <RotateCcw className="size-4" />
              Reset Poses
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <ControlGroup
            icon={<UserRound className="size-5" />}
            title="Shooter Position"
          >
            <RangeControl
              label="Shooter X"
              max={50}
              min={0}
              step={0.1}
              value={shooter.x}
              onChange={(x) => setShooterPosition({ ...shooter, x }, "simulator")}
            />
            <RangeControl
              label="Shooter Y"
              max={47}
              min={0}
              step={0.1}
              value={shooter.y}
              onChange={(y) => setShooterPosition({ ...shooter, y }, "simulator")}
            />
          </ControlGroup>

          <ControlGroup
            icon={<UserRound className="size-5" />}
            title="Shooter Pose"
          >
            <RangeControl
              label="Release Angle"
              max={75}
              min={20}
              step={1}
              value={shooterPose.releaseAngle}
              onChange={(releaseAngle) =>
                updateShooterPose({ releaseAngle }, "simulator")
              }
            />
            <RangeControl
              label="Knee Bend"
              max={60}
              min={0}
              step={1}
              value={shooterPose.kneeBend}
              onChange={(kneeBend) => updateShooterPose({ kneeBend }, "simulator")}
            />
            <RangeControl
              label="Hand Height"
              max={11}
              min={5}
              step={0.1}
              value={shooterPose.handHeight}
              onChange={(handHeight) =>
                updateShooterPose({ handHeight }, "simulator")
              }
            />
            <ToggleRow
              active={shooterPose.isAirborne}
              label="Airborne"
              onToggle={() =>
                updateShooterPose(
                  {
                    isAirborne: !shooterPose.isAirborne,
                    verticalOffset: shooterPose.isAirborne ? 0 : 0.6,
                  },
                  "simulator",
                )
              }
            />
          </ControlGroup>

          <ControlGroup icon={<Shield className="size-5" />} title="Defender">
            <ToggleRow
              active={activeDefenderCount === 2}
              label={`${activeDefenderCount} Active Defender${
                activeDefenderCount > 1 ? "s" : ""
              }`}
              onToggle={() =>
                setDefenderCount(
                  (activeDefenderCount === 1 ? 2 : 1) as ActiveDefenderCount,
                  "simulator",
                )
              }
            />
            {primaryDefender ? (
              <>
                <RangeControl
                  label="Defender X"
                  max={50}
                  min={0}
                  step={0.1}
                  value={primaryDefender.x}
                  onChange={(x) =>
                    setDefenderPosition(
                      primaryDefender.id,
                      { x, y: primaryDefender.y },
                      "simulator",
                    )
                  }
                />
                <RangeControl
                  label="Defender Y"
                  max={47}
                  min={0}
                  step={0.1}
                  value={primaryDefender.y}
                  onChange={(y) =>
                    setDefenderPosition(
                      primaryDefender.id,
                      { x: primaryDefender.x, y },
                      "simulator",
                    )
                  }
                />
              </>
            ) : null}
          </ControlGroup>

          <ControlGroup
            icon={<Shield className="size-5" />}
            title="Defender Pose"
          >
            {primaryDefender ? (
              <>
                <RangeControl
                  label="Arm Raise"
                  max={100}
                  min={0}
                  step={1}
                  value={primaryDefenderPose.armRaise}
                  onChange={(armRaise) =>
                    updateDefenderPose(primaryDefender.id, { armRaise }, "simulator")
                  }
                />
                <RangeControl
                  label="Contest Height"
                  max={12}
                  min={5}
                  step={0.1}
                  value={primaryDefenderPose.contestHeight}
                  onChange={(contestHeight) =>
                    updateDefenderPose(
                      primaryDefender.id,
                      { contestHeight },
                      "simulator",
                    )
                  }
                />
                <RangeControl
                  label="Lean Angle"
                  max={30}
                  min={-30}
                  step={1}
                  value={primaryDefenderPose.leanAngle}
                  onChange={(leanAngle) =>
                    updateDefenderPose(primaryDefender.id, { leanAngle }, "simulator")
                  }
                />
              </>
            ) : null}
          </ControlGroup>
        </div>
      </section>

      <aside className="rounded-lg border border-white/10 bg-black/30 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-5 lg:sticky lg:top-5 lg:self-start">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Live Shot Snapshot
        </p>
        <div className="mt-4 grid gap-3">
          <SnapshotRow label="Distance" value={`${shotDistance.toFixed(1)} ft`} />
          <SnapshotRow label="Zone" value={shotZone} />
          <SnapshotRow label="Pressure" value={pressureLevel} />
          <SnapshotRow label="EPPS" value={epps.toFixed(2)} />
          <SnapshotRow label="Source" value={predictionSource} />
        </div>
      </aside>
    </div>
  );
}

function ControlGroup({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  // Group related simulator inputs without coupling them to a visual stickman.
  return (
    <section className="rounded-lg border border-white/10 bg-black/25 p-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg border border-current/20 bg-white/[0.06] text-green-100">
          {icon}
        </span>
        <h2 className="text-sm font-black text-white">{title}</h2>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function RangeControl({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  // Range controls update Zustand directly so /sandbox receives changes too.
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        <span>{label}</span>
        <span className="text-slate-200">{value.toFixed(1)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full accent-orange-400"
      />
    </label>
  );
}

function ToggleRow({
  active,
  label,
  onToggle,
}: {
  active: boolean;
  label: string;
  onToggle: () => void;
}) {
  // Toggle rows handle boolean pose and defender settings.
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={`flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm font-bold transition ${
        active
          ? "border-green-300/30 bg-green-400/10 text-green-100"
          : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20"
      }`}
    >
      <span>{label}</span>
      <span className="text-xs uppercase tracking-[0.16em]">
        {active ? "On" : "Off"}
      </span>
    </button>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  // Snapshot rows expose the shared store values currently visible to both pages.
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span className="truncate text-sm font-black text-white">{value}</span>
    </div>
  );
}
