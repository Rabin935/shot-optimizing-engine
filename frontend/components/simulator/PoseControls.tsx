"use client";

import { ChevronDown, RotateCcw, Shield, Target } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  useShotStore,
  type DefenderPoseState,
  type ShooterPoseState,
} from "@/store/useShotStore";

type PoseControlsProps = {
  onDefenderContestJump: () => void;
  onResetElevation: () => void;
  onShooterJump: () => void;
};

type SliderConfig<T> = {
  key: keyof T;
  label: string;
  max: number;
  min: number;
  step: number;
};

const SHOOTER_PEAK_ELEVATION = { jumpHeight: 9.2, verticalOffset: 1.45 };
const DEFENDER_PEAK_ELEVATION = { jumpHeight: 8.4, verticalOffset: 1.2 };

const SHOOTER_SLIDERS: SliderConfig<ShooterPoseState>[] = [
  { key: "torsoAngle", label: "Torso Angle", max: 35, min: -35, step: 1 },
  { key: "kneeBend", label: "Knee Bend", max: 60, min: 0, step: 1 },
  { key: "leftLegAngle", label: "Left Leg Angle", max: 45, min: -45, step: 1 },
  { key: "rightLegAngle", label: "Right Leg Angle", max: 45, min: -45, step: 1 },
  { key: "shootingArmAngle", label: "Shooting Arm", max: 95, min: 10, step: 1 },
  { key: "guideHandAngle", label: "Guide Hand", max: 70, min: 0, step: 1 },
  { key: "handHeight", label: "Hand Height", max: 12, min: 5, step: 0.1 },
  { key: "releaseAngle", label: "Release Angle", max: 75, min: 20, step: 1 },
  { key: "jumpHeight", label: "Jump Height", max: 12, min: 0, step: 0.1 },
];

const DEFENDER_SLIDERS: SliderConfig<DefenderPoseState>[] = [
  { key: "torsoAngle", label: "Torso Angle", max: 35, min: -35, step: 1 },
  { key: "kneeBend", label: "Knee Bend", max: 60, min: 0, step: 1 },
  { key: "armRaise", label: "Arm Raise", max: 100, min: 0, step: 1 },
  { key: "contestHeight", label: "Contest Height", max: 12, min: 5, step: 0.1 },
  { key: "stanceWidth", label: "Stance Width", max: 5, min: 0, step: 0.1 },
  { key: "leanAngle", label: "Lean Angle", max: 30, min: -30, step: 1 },
  { key: "jumpHeight", label: "Jump Height", max: 12, min: 0, step: 0.1 },
];

const SHOOTER_PRESETS: Record<string, Partial<ShooterPoseState>> = {
  "Balanced Jumper": {
    guideHandAngle: 28,
    handHeight: 8.8,
    isAirborne: true,
    jumpHeight: 7.4,
    kneeBend: 16,
    leftLegAngle: 10,
    releaseAngle: 49,
    rightLegAngle: -10,
    shootingArmAngle: 64,
    torsoAngle: 2,
    verticalOffset: 0.9,
  },
  Fadeaway: {
    guideHandAngle: 32,
    handHeight: 9.2,
    isAirborne: true,
    jumpHeight: 8.2,
    kneeBend: 12,
    leftLegAngle: 18,
    releaseAngle: 54,
    rightLegAngle: 4,
    shootingArmAngle: 72,
    torsoAngle: -14,
    verticalOffset: 1.1,
  },
  "Quick Release": {
    guideHandAngle: 18,
    handHeight: 8,
    isAirborne: true,
    jumpHeight: 4.8,
    kneeBend: 10,
    leftLegAngle: 6,
    releaseAngle: 45,
    rightLegAngle: -6,
    shootingArmAngle: 82,
    torsoAngle: 6,
    verticalOffset: 0.55,
  },
};

const DEFENDER_PRESETS: Record<string, Partial<DefenderPoseState>> = {
  "Strong Contest": {
    armRaise: 96,
    contestHeight: 10.8,
    isAirborne: true,
    jumpHeight: 8.4,
    kneeBend: 8,
    leanAngle: -6,
    stanceWidth: 3.3,
    torsoAngle: -4,
    verticalOffset: 1.1,
  },
  "Late Contest": {
    armRaise: 72,
    contestHeight: 8.4,
    isAirborne: true,
    jumpHeight: 4,
    kneeBend: 18,
    leanAngle: 12,
    stanceWidth: 2.6,
    torsoAngle: 10,
    verticalOffset: 0.45,
  },
  "Hands Down": {
    armRaise: 8,
    contestHeight: 5.8,
    isAirborne: false,
    jumpHeight: 0,
    kneeBend: 14,
    leanAngle: 0,
    stanceWidth: 2,
    torsoAngle: 0,
    verticalOffset: 0,
  },
};

export function PoseControls({
  onDefenderContestJump,
  onResetElevation,
  onShooterJump,
}: PoseControlsProps) {
  const [isShooterOpen, setIsShooterOpen] = useState(true);
  const [isDefenderOpen, setIsDefenderOpen] = useState(true);
  const activeDefenderCount = useShotStore((state) => state.activeDefenderCount);
  const defenders = useShotStore((state) => state.defenders);
  const defenderPoses = useShotStore((state) => state.defenderPoses);
  const shooterPose = useShotStore((state) => state.shooterPose);
  const resetPoses = useShotStore((state) => state.resetPoses);
  const updateDefenderPose = useShotStore((state) => state.updateDefenderPose);
  const updateShooterPose = useShotStore((state) => state.updateShooterPose);
  const activeDefenders = defenders.slice(0, activeDefenderCount);
  const primaryDefenderId = activeDefenders[0]?.id ?? "d1";
  const defenderPose = useMemo(
    () => defenderPoses[primaryDefenderId] ?? defenderPoses.d1,
    [defenderPoses, primaryDefenderId],
  );

  function updateShooterSlider(key: keyof ShooterPoseState, value: number) {
    // Jump height controls should also flip airborne state so the SVG body
    // immediately floats when the slider leaves the ground.
    updateShooterPose(
      key === "jumpHeight"
        ? {
            isAirborne: value > 0 || shooterPose.verticalOffset > 0,
            jumpHeight: value,
          }
        : { [key]: value },
      "simulator",
    );
  }

  function updateDefenderSlider(key: keyof DefenderPoseState, value: number) {
    // Defender sliders patch only the active defender's pose, preserving the
    // independent pose state for any secondary defender.
    updateDefenderPose(
      primaryDefenderId,
      key === "jumpHeight"
        ? {
            isAirborne: value > 0 || defenderPose.verticalOffset > 0,
            jumpHeight: value,
          }
        : { [key]: value },
      "simulator",
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-black/30 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Pose Control Panel
          </p>
          <p className="mt-1 text-sm font-black text-white">
            Manual stickman posture
          </p>
        </div>
        <button
          type="button"
          onClick={() => resetPoses("simulator")}
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-black text-slate-200 transition hover:border-orange-300/35 hover:text-orange-100"
        >
          <RotateCcw className="size-4" />
          Reset Pose
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <ActionButton
          icon={<Target className="size-4" />}
          label="Shooter Jump"
          tone="orange"
          onClick={onShooterJump}
        />
        <ActionButton
          icon={<Shield className="size-4" />}
          label="Contest Jump"
          tone="green"
          onClick={onDefenderContestJump}
        />
        <ActionButton
          icon={<RotateCcw className="size-4" />}
          label="Reset Elevation"
          tone="neutral"
          onClick={onResetElevation}
        />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {Object.entries(SHOOTER_PRESETS).map(([label, pose]) => (
          <PresetButton
            key={label}
            label={label}
            tone="orange"
            onClick={() => updateShooterPose(pose, "simulator")}
          />
        ))}
        {Object.entries(DEFENDER_PRESETS).map(([label, pose]) => (
          <PresetButton
            key={label}
            label={label}
            tone="green"
            onClick={() => updateDefenderPose(primaryDefenderId, pose, "simulator")}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-3">
        <CollapsibleSection
          isOpen={isShooterOpen}
          title="Shooter Pose"
          tone="orange"
          onToggle={() => setIsShooterOpen((current) => !current)}
        >
          <div className="grid gap-4">
            {SHOOTER_SLIDERS.map((slider) => (
              <RangeControl
                key={String(slider.key)}
                fieldKey={slider.key}
                label={slider.label}
                max={slider.max}
                min={slider.min}
                step={slider.step}
                value={Number(shooterPose[slider.key])}
                onChange={(value) => updateShooterSlider(slider.key, value)}
              />
            ))}
            <ToggleRow
              active={shooterPose.isAirborne}
              label="Shooter Airborne"
              onToggle={() =>
                updateShooterPose(
                  {
                    isAirborne: !shooterPose.isAirborne,
                    jumpHeight: shooterPose.isAirborne
                      ? 0
                      : SHOOTER_PEAK_ELEVATION.jumpHeight,
                    verticalOffset: shooterPose.isAirborne
                      ? 0
                      : SHOOTER_PEAK_ELEVATION.verticalOffset,
                  },
                  "simulator",
                )
              }
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          isOpen={isDefenderOpen}
          title="Defender Pose"
          tone="green"
          onToggle={() => setIsDefenderOpen((current) => !current)}
        >
          <div className="grid gap-4">
            {DEFENDER_SLIDERS.map((slider) => (
              <RangeControl
                key={String(slider.key)}
                fieldKey={slider.key}
                label={slider.label}
                max={slider.max}
                min={slider.min}
                step={slider.step}
                value={Number(defenderPose[slider.key])}
                onChange={(value) => updateDefenderSlider(slider.key, value)}
              />
            ))}
            <ToggleRow
              active={defenderPose.isAirborne}
              label="Defender Airborne"
              onToggle={() =>
                updateDefenderPose(
                  primaryDefenderId,
                  {
                    isAirborne: !defenderPose.isAirborne,
                    jumpHeight: defenderPose.isAirborne
                      ? 0
                      : DEFENDER_PEAK_ELEVATION.jumpHeight,
                    verticalOffset: defenderPose.isAirborne
                      ? 0
                      : DEFENDER_PEAK_ELEVATION.verticalOffset,
                  },
                  "simulator",
                )
              }
            />
          </div>
        </CollapsibleSection>
      </div>
    </section>
  );
}

function CollapsibleSection({
  children,
  isOpen,
  onToggle,
  title,
  tone,
}: {
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  tone: "green" | "orange";
}) {
  return (
    <div className="border-t border-white/10 pt-3">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg bg-white/[0.04] px-3 py-2 text-left transition hover:bg-white/[0.07]"
      >
        <span className={`text-xs font-black uppercase tracking-[0.16em] ${toneTextClasses[tone]}`}>
          {title}
        </span>
        <ChevronDown
          className={`size-4 text-slate-300 transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function RangeControl<T>({
  fieldKey,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: Omit<SliderConfig<T>, "key"> & {
  fieldKey: keyof T;
  onChange: (value: number) => void;
  value: number;
}) {
  // Every slider writes directly to the shared store, so the SVG stickman
  // re-renders on the same frame as the user's drag.
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        <span>{label}</span>
        <span className="text-slate-200">{value.toFixed(1)}</span>
      </span>
      <input
        name={String(fieldKey)}
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

function ActionButton({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  tone: "green" | "orange" | "neutral";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition ${actionButtonClasses[tone]}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function PresetButton({
  label,
  onClick,
  tone,
}: {
  label: string;
  onClick: () => void;
  tone: "green" | "orange";
}) {
  // Presets are partial pose patches, letting users jump to common body shapes
  // without overwriting unrelated court position state.
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-black transition ${presetButtonClasses[tone]}`}
    >
      {label}
    </button>
  );
}

const actionButtonClasses = {
  green:
    "border-green-300/25 bg-green-400/10 text-green-100 hover:bg-green-400/20",
  neutral:
    "border-white/10 bg-white/[0.05] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]",
  orange:
    "border-orange-300/25 bg-orange-500/10 text-orange-100 hover:bg-orange-500/20",
};

const presetButtonClasses = {
  green:
    "border-green-300/20 bg-green-400/[0.08] text-green-100 hover:bg-green-400/15",
  orange:
    "border-orange-300/20 bg-orange-500/[0.08] text-orange-100 hover:bg-orange-500/15",
};

const toneTextClasses = {
  green: "text-green-100",
  orange: "text-orange-100",
};
