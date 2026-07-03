"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { MechanicsScore } from "@/lib/simulator-analysis";
import type { ShootingAnimationStage } from "@/lib/simulator-animation";
import {
  SHOOTING_ANIMATION_KEYFRAMES,
  getTimelineFrame,
} from "@/lib/simulator-animation";
import type { PosePreset } from "@/lib/simulator-presets";
import type { ShotOutcomeKind } from "@/lib/simulator-physics";

export type ShotPoint = {
  x: number;
  y: number;
};

export type ShotDefenderPosition = ShotPoint & {
  id: string;
};

export type ActiveDefenderCount = 1 | 2;

export type SharedShotZone = "Paint" | "Mid-Range" | "Three Point";
export type SharedPressureLevel = "Very Tight" | "Tight" | "Open" | "Very Open";
export type SharedShotQuality = "Excellent" | "Good" | "Average" | "Poor" | "Bad";

export type PredictionSource =
  | "local_estimate"
  | "ml_model"
  | "rule_based_fallback"
  | "prediction_engine";

export type StoreUpdateSource =
  | "backend"
  | "optimizer"
  | "replay"
  | "sandbox"
  | "simulator"
  | "system";

export type ShotMetricsState = {
  shotDistance: number;
  shotAngle: number;
  shotZone: SharedShotZone;
  shotValue: 2 | 3;
  closestDefenderDistance: number;
  pressureLevel: SharedPressureLevel;
  makeProbability: number;
  epps: number;
  shotQuality: SharedShotQuality;
  recommendation: string;
  confidence: string;
  predictionSource: PredictionSource;
};

export type ShooterPoseState = {
  torsoAngle: number;
  kneeBend: number;
  leftLegAngle: number;
  rightLegAngle: number;
  shootingArmAngle: number;
  guideHandAngle: number;
  handHeight: number;
  releaseAngle: number;
  jumpHeight: number;
  verticalOffset: number;
  isAirborne: boolean;
};

export type DefenderPoseState = {
  torsoAngle: number;
  kneeBend: number;
  armRaise: number;
  contestHeight: number;
  stanceWidth: number;
  leanAngle: number;
  jumpHeight: number;
  verticalOffset: number;
  isAirborne: boolean;
};

export type OptimizedShotState = {
  appliedAt: string;
  epps: number;
  makeProbability: number;
  pressureLevel: SharedPressureLevel;
  shotQuality: SharedShotQuality;
  shotValue: 2 | 3;
  title: string;
};

export type ShotReplayEntry = {
  activeDefenderCount: ActiveDefenderCount;
  createdAt: string;
  defenderPoses: Record<string, DefenderPoseState>;
  defenders: ShotDefenderPosition[];
  id: string;
  label: string;
  mechanicsScore: MechanicsScore;
  metrics: ShotMetricsState;
  shooter: ShotPoint;
  shooterPose: ShooterPoseState;
  shotOutcome: ShotOutcomeKind;
  timelineProgress: number;
};

type ShotStoreState = {
  shooter: ShotPoint;
  defenders: ShotDefenderPosition[];
  activeDefenderCount: ActiveDefenderCount;
  shooterPose: ShooterPoseState;
  defenderPoses: Record<string, DefenderPoseState>;
  animationPlaying: boolean;
  animationProgress: number;
  animationStage: ShootingAnimationStage;
  comparisonMode: boolean;
  customPosePresets: PosePreset[];
  optimizedShot: OptimizedShotState | null;
  replayHistory: ShotReplayEntry[];
  shotOutcome: ShotOutcomeKind;
  slowMotion: boolean;
  lastUpdatedBy: StoreUpdateSource;
} & ShotMetricsState;

type ShotStoreActions = {
  setShooterPosition: (
    position: ShotPoint,
    source?: StoreUpdateSource,
  ) => void;
  setDefenderPosition: (
    defenderId: string,
    position: ShotPoint,
    source?: StoreUpdateSource,
  ) => void;
  setDefenderCount: (
    count: ActiveDefenderCount,
    source?: StoreUpdateSource,
  ) => void;
  updateShotMetrics: (
    metrics: Partial<ShotMetricsState>,
    source?: StoreUpdateSource,
  ) => void;
  updatePredictionResult: (
    prediction: Partial<
      Pick<
        ShotMetricsState,
        | "makeProbability"
        | "epps"
        | "shotQuality"
        | "recommendation"
        | "confidence"
        | "predictionSource"
      >
    >,
    source?: StoreUpdateSource,
  ) => void;
  updateShooterPose: (
    pose: Partial<ShooterPoseState>,
    source?: StoreUpdateSource,
  ) => void;
  updateDefenderPose: (
    defenderId: string,
    pose: Partial<DefenderPoseState>,
    source?: StoreUpdateSource,
  ) => void;
  addCustomPosePreset: (preset: PosePreset, source?: StoreUpdateSource) => void;
  deleteReplay: (replayId: string, source?: StoreUpdateSource) => void;
  loadOptimizerShot: (
    shot: Omit<OptimizedShotState, "appliedAt"> & {
      shooterPose?: Partial<ShooterPoseState>;
    },
    source?: StoreUpdateSource,
  ) => void;
  loadReplay: (replayId: string, source?: StoreUpdateSource) => void;
  resetShot: (source?: StoreUpdateSource) => void;
  resetPoses: (source?: StoreUpdateSource) => void;
  saveReplay: (
    replay: Omit<ShotReplayEntry, "createdAt" | "id" | "label"> & {
      label?: string;
    },
    source?: StoreUpdateSource,
  ) => void;
  setAnimationPlaying: (
    isPlaying: boolean,
    source?: StoreUpdateSource,
  ) => void;
  setAnimationProgress: (
    progress: number,
    source?: StoreUpdateSource,
  ) => void;
  setComparisonMode: (enabled: boolean, source?: StoreUpdateSource) => void;
  setShotOutcome: (outcome: ShotOutcomeKind, source?: StoreUpdateSource) => void;
  setSlowMotion: (enabled: boolean, source?: StoreUpdateSource) => void;
};

export type ShotStore = ShotStoreState & ShotStoreActions;

// Default court coordinates match the current /sandbox wing pull-up scenario.
export const DEFAULT_SHOOTER: ShotPoint = { x: 38, y: 26 };

export const DEFAULT_DEFENDERS: ShotDefenderPosition[] = [
  { id: "d1", x: 33, y: 23 },
  { id: "d2", x: 18, y: 20 },
];

// Metrics start as a local placeholder until SandboxExperience calculates a shot.
const DEFAULT_METRICS: ShotMetricsState = {
  shotDistance: 0,
  shotAngle: 0,
  shotZone: "Mid-Range",
  shotValue: 2,
  closestDefenderDistance: Number.POSITIVE_INFINITY,
  pressureLevel: "Very Open",
  makeProbability: 0,
  epps: 0,
  shotQuality: "Average",
  recommendation: "Move the shooter or defenders to calculate the shot.",
  confidence: "Local estimate",
  predictionSource: "local_estimate",
};

// Shooter pose values are shared with the future 2D stickman simulator.
const DEFAULT_SHOOTER_POSE: ShooterPoseState = {
  torsoAngle: 0,
  kneeBend: 24,
  leftLegAngle: 12,
  rightLegAngle: -12,
  shootingArmAngle: 52,
  guideHandAngle: 28,
  handHeight: 8.4,
  releaseAngle: 48,
  jumpHeight: 0,
  verticalOffset: 0,
  isAirborne: false,
};

// Defender pose values describe the contest stance for each simulator defender.
const DEFAULT_DEFENDER_POSE: DefenderPoseState = {
  torsoAngle: 0,
  kneeBend: 18,
  armRaise: 64,
  contestHeight: 8.8,
  stanceWidth: 2.8,
  leanAngle: 0,
  jumpHeight: 0,
  verticalOffset: 0,
  isAirborne: false,
};

// Each defender gets its own pose object so pose edits do not overwrite others.
const DEFAULT_DEFENDER_POSES: Record<string, DefenderPoseState> = {
  d1: { ...DEFAULT_DEFENDER_POSE },
  d2: { ...DEFAULT_DEFENDER_POSE, leanAngle: -4 },
};

// DEFAULT_SHOT_STATE combines position, metrics, and pose into one store shape.
const DEFAULT_SHOT_STATE: ShotStoreState = {
  ...DEFAULT_METRICS,
  animationPlaying: false,
  animationProgress: SHOOTING_ANIMATION_KEYFRAMES[0].progress,
  animationStage: SHOOTING_ANIMATION_KEYFRAMES[0].label,
  comparisonMode: false,
  customPosePresets: [],
  shooter: DEFAULT_SHOOTER,
  defenders: DEFAULT_DEFENDERS,
  activeDefenderCount: 2,
  shooterPose: DEFAULT_SHOOTER_POSE,
  defenderPoses: DEFAULT_DEFENDER_POSES,
  optimizedShot: null,
  replayHistory: [],
  shotOutcome: "make",
  slowMotion: false,
  lastUpdatedBy: "system",
};

function pointsEqual(a: ShotPoint, b: ShotPoint) {
  // Avoid state writes when both pages send the same coordinates back to the store.
  return a.x === b.x && a.y === b.y;
}

function shallowValuesEqual<T extends Record<string, unknown>>(
  current: T,
  next: Partial<T>,
) {
  // Zustand updates only when at least one patched field actually changed.
  return Object.entries(next).every(
    ([key, value]) => current[key as keyof T] === value,
  );
}

function cloneDefaultDefenders() {
  // Return fresh defender objects so resetShot never reuses mutable references.
  return DEFAULT_DEFENDERS.map((defender) => ({ ...defender }));
}

function cloneDefaultDefenderPoses() {
  // Return fresh pose objects so resetPoses is isolated from previous edits.
  return Object.fromEntries(
    Object.entries(DEFAULT_DEFENDER_POSES).map(([id, pose]) => [
      id,
      { ...pose },
    ]),
  );
}

export const useShotStore = create<ShotStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SHOT_STATE,
      shooter: { ...DEFAULT_SHOT_STATE.shooter },
      defenders: cloneDefaultDefenders(),
      shooterPose: { ...DEFAULT_SHOOTER_POSE },
      defenderPoses: cloneDefaultDefenderPoses(),
      customPosePresets: [],
      replayHistory: [],

      setShooterPosition: (position, source = "sandbox") =>
        set((state) => {
          // Skip updates when the same shooter position is written twice.
          if (pointsEqual(state.shooter, position)) {
            return state;
          }

          return {
            shooter: { ...position },
            lastUpdatedBy: source,
          };
        }),

      setDefenderPosition: (defenderId, position, source = "sandbox") =>
        set((state) => {
          // Update an existing defender or add it if the simulator creates one.
          const defenderExists = state.defenders.some(
            (defender) => defender.id === defenderId,
          );
          const currentDefender = state.defenders.find(
            (defender) => defender.id === defenderId,
          );

          if (currentDefender && pointsEqual(currentDefender, position)) {
            return state;
          }

          return {
            defenders: defenderExists
              ? state.defenders.map((defender) =>
                  defender.id === defenderId
                    ? { ...defender, ...position }
                    : defender,
                )
              : [...state.defenders, { id: defenderId, ...position }],
            lastUpdatedBy: source,
          };
        }),

      setDefenderCount: (count, source = "sandbox") =>
        set((state) => {
          // Keep the active defender count shared between sandbox and simulator.
          if (state.activeDefenderCount === count) {
            return state;
          }

          return {
            activeDefenderCount: count,
            lastUpdatedBy: source,
          };
        }),

      updateShotMetrics: (metrics, source = "sandbox") =>
        set((state) => {
          // Local sandbox calculations publish distance, zone, pressure, and EPPS.
          if (shallowValuesEqual(state, metrics)) {
            return state;
          }

          return {
            ...metrics,
            lastUpdatedBy: source,
          };
        }),

      updatePredictionResult: (prediction, source = "backend") =>
        set((state) => {
          // Backend ML/fallback results overwrite final probability-related fields.
          if (shallowValuesEqual(state, prediction)) {
            return state;
          }

          return {
            ...prediction,
            lastUpdatedBy: source,
          };
        }),

      updateShooterPose: (pose, source = "simulator") =>
        set((state) => {
          // Simulator controls patch only the shooter pose fields that changed.
          if (shallowValuesEqual(state.shooterPose, pose)) {
            return state;
          }

          return {
            shooterPose: {
              ...state.shooterPose,
              ...pose,
            },
            lastUpdatedBy: source,
          };
        }),

      updateDefenderPose: (defenderId, pose, source = "simulator") =>
        set((state) => {
          // Defender pose is keyed by id so each defender can move independently.
          const currentPose = state.defenderPoses[defenderId] ?? DEFAULT_DEFENDER_POSE;

          if (shallowValuesEqual(currentPose, pose)) {
            return state;
          }

          return {
            defenderPoses: {
              ...state.defenderPoses,
              [defenderId]: {
                ...currentPose,
                ...pose,
              },
            },
            lastUpdatedBy: source,
          };
        }),

      addCustomPosePreset: (preset, source = "simulator") =>
        set((state) => ({
          customPosePresets: [preset, ...state.customPosePresets].slice(0, 12),
          lastUpdatedBy: source,
        })),

      deleteReplay: (replayId, source = "simulator") =>
        set((state) => ({
          replayHistory: state.replayHistory.filter(
            (replay) => replay.id !== replayId,
          ),
          lastUpdatedBy: source,
        })),

      loadOptimizerShot: (shot, source = "optimizer") =>
        set((state) => ({
          epps: shot.epps,
          makeProbability: shot.makeProbability,
          optimizedShot: {
            appliedAt: new Date().toISOString(),
            epps: shot.epps,
            makeProbability: shot.makeProbability,
            pressureLevel: shot.pressureLevel,
            shotQuality: shot.shotQuality,
            shotValue: shot.shotValue,
            title: shot.title,
          },
          pressureLevel: shot.pressureLevel,
          recommendation: `Optimizer loaded ${shot.title}. Review the mechanics timeline and coaching feedback.`,
          shotQuality: shot.shotQuality,
          shotValue: shot.shotValue,
          shooterPose: {
            ...state.shooterPose,
            ...(shot.shooterPose ?? {}),
          },
          animationPlaying: true,
          animationProgress: 0,
          animationStage: SHOOTING_ANIMATION_KEYFRAMES[0].label,
          lastUpdatedBy: source,
        })),

      loadReplay: (replayId, source = "replay") =>
        set((state) => {
          const replay = state.replayHistory.find((item) => item.id === replayId);

          if (!replay) {
            return state;
          }

          return {
            ...replay.metrics,
            activeDefenderCount: replay.activeDefenderCount,
            animationPlaying: true,
            animationProgress: replay.timelineProgress,
            animationStage: getTimelineFrame(replay.timelineProgress).label,
            defenderPoses: cloneDefenderPoseRecord(replay.defenderPoses),
            defenders: replay.defenders.map((defender) => ({ ...defender })),
            shooter: { ...replay.shooter },
            shooterPose: { ...replay.shooterPose },
            shotOutcome: replay.shotOutcome,
            lastUpdatedBy: source,
          };
        }),

      resetShot: (source = "system") =>
        // Reset shared shot position and metrics without changing pose controls.
        set({
          ...DEFAULT_METRICS,
          shooter: { ...DEFAULT_SHOOTER },
          defenders: cloneDefaultDefenders(),
          activeDefenderCount: 2,
          optimizedShot: null,
          lastUpdatedBy: source,
        }),

      resetPoses: (source = "system") =>
        // Reset only pose controls so court positions can remain unchanged.
        set({
          shooterPose: { ...DEFAULT_SHOOTER_POSE },
          defenderPoses: cloneDefaultDefenderPoses(),
          lastUpdatedBy: source,
        }),

      saveReplay: (replay, source = "simulator") =>
        set((state) => {
          const createdAt = new Date().toISOString();
          const entry: ShotReplayEntry = {
            ...replay,
            createdAt,
            id: `shot-${Date.now()}`,
            label: replay.label ?? `Shot #${state.replayHistory.length + 1}`,
          };

          return {
            replayHistory: [entry, ...state.replayHistory].slice(0, 24),
            lastUpdatedBy: source,
          };
        }),

      setAnimationPlaying: (isPlaying, source = "simulator") =>
        set((state) =>
          state.animationPlaying === isPlaying
            ? state
            : { animationPlaying: isPlaying, lastUpdatedBy: source },
        ),

      setAnimationProgress: (progress, source = "simulator") =>
        set((state) => {
          const normalizedProgress = Math.min(Math.max(progress, 0), 100);
          const nextStage = getTimelineFrame(normalizedProgress).label;

          if (
            state.animationProgress === normalizedProgress &&
            state.animationStage === nextStage
          ) {
            return state;
          }

          return {
            animationProgress: normalizedProgress,
            animationStage: nextStage,
            lastUpdatedBy: source,
          };
        }),

      setComparisonMode: (enabled, source = "simulator") =>
        set((state) =>
          state.comparisonMode === enabled
            ? state
            : { comparisonMode: enabled, lastUpdatedBy: source },
        ),

      setShotOutcome: (outcome, source = "simulator") =>
        set((state) =>
          state.shotOutcome === outcome
            ? state
            : { shotOutcome: outcome, lastUpdatedBy: source },
        ),

      setSlowMotion: (enabled, source = "simulator") =>
        set((state) =>
          state.slowMotion === enabled
            ? state
            : { slowMotion: enabled, lastUpdatedBy: source },
        ),
    }),
    {
      name: "shotoptix-shot-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist user-editable state; derived metrics recalculate on page load.
        shooter: state.shooter,
        defenders: state.defenders,
        activeDefenderCount: state.activeDefenderCount,
        shooterPose: state.shooterPose,
        defenderPoses: state.defenderPoses,
        animationProgress: state.animationProgress,
        comparisonMode: state.comparisonMode,
        customPosePresets: state.customPosePresets,
        optimizedShot: state.optimizedShot,
        replayHistory: state.replayHistory,
        shotOutcome: state.shotOutcome,
        slowMotion: state.slowMotion,
      }),
    },
  ),
);

function cloneDefenderPoseRecord(poses: Record<string, DefenderPoseState>) {
  return Object.fromEntries(
    Object.entries(poses).map(([id, pose]) => [id, { ...pose }]),
  );
}
