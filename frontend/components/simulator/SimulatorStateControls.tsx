"use client";

import {
  Activity,
  CheckCircle2,
  Grip,
  Gauge,
  RotateCcw,
  Send,
  Shield,
  Target,
  Users,
} from "lucide-react";
import type {
  Dispatch,
  PointerEvent,
  ReactNode,
  RefObject,
  SetStateAction,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdvancedSimulatorInsights } from "@/components/simulator/AdvancedSimulatorInsights";
import { PoseControls } from "@/components/simulator/PoseControls";
import { PoseAnalytics } from "@/components/simulator/PoseAnalytics";
import {
  ShotArc,
  ShotArcControls,
  type StagePoint,
} from "@/components/simulator/ShotArc";
import {
  StickmanPlayer,
  getStickmanGeometry,
  getStickmanHitGeometry,
  type StickmanHitGeometry,
  type StickmanPoseDrag,
} from "@/components/simulator/StickmanPlayer";
import {
  SHOOTING_ANIMATION_KEYFRAMES,
  getTimelineFrameIndex,
  interpolateDefenderPose,
  interpolateShooterPose,
  nextFrameProgress,
  previousFrameProgress,
} from "@/lib/simulator-animation";
import {
  calculateMechanicsScore,
  comparePoses,
  getRecommendedShooterPose,
} from "@/lib/simulator-analysis";
import {
  getArcControlPoint,
  getBezierPoint,
  getReleasePoint,
  selectShotOutcome,
  type ShotOutcomeKind,
} from "@/lib/simulator-physics";
import {
  courtStateToSimulatorContext,
  getDefenderDistanceLimits,
  getShotDistanceLimits,
  simulatorContextsEqual,
  simulatorContextToCourt,
  type MappedCourtContext,
  type SimulatorShotContext,
} from "@/lib/simulator-court-sync";
import {
  useShotStore,
  type DefenderPoseState,
  type SharedShotQuality,
  type ShooterPoseState,
  type ShotReplayEntry,
} from "@/store/useShotStore";

const STAGE_WIDTH = 1080;
const STAGE_HEIGHT = 640;
const FLOOR_Y = 538;
const RIM = { x: 976, y: 298 };
const LEGACY_RIM_TARGETS: StagePoint[] = [
  { x: 792, y: 298 },
  { x: 792, y: 178 },
];
const STAGE_COURT_MIN_X = 118;
const STAGE_COURT_MAX_X = 678;
const STAGE_COURT_MIN_Y = FLOOR_Y - 58;
const STAGE_COURT_MAX_Y = FLOOR_Y;
const SHOOTER_PEAK_ELEVATION = { jumpHeight: 8.2, verticalOffset: 1.28 };
const DEFENDER_PEAK_ELEVATION = { jumpHeight: 11.2, verticalOffset: 1.78 };

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

type BlockInfo = { point: StagePoint; progress: number };

export function SimulatorStateControls() {
  // This component is the Phase 5 simulator shell that consumes shared shot state.
  const shooter = useShotStore((state) => state.shooter);
  const defenders = useShotStore((state) => state.defenders);
  const activeDefenderCount = useShotStore(
    (state) => state.activeDefenderCount,
  );
  const shooterPose = useShotStore((state) => state.shooterPose);
  const defenderPoses = useShotStore((state) => state.defenderPoses);
  const shotDistance = useShotStore((state) => state.shotDistance);
  const shotAngle = useShotStore((state) => state.shotAngle);
  const shotZone = useShotStore((state) => state.shotZone);
  const shotValue = useShotStore((state) => state.shotValue);
  const closestDefenderDistance = useShotStore(
    (state) => state.closestDefenderDistance,
  );
  const pressureLevel = useShotStore((state) => state.pressureLevel);
  const makeProbability = useShotStore((state) => state.makeProbability);
  const epps = useShotStore((state) => state.epps);
  const shotQuality = useShotStore((state) => state.shotQuality);
  const recommendation = useShotStore((state) => state.recommendation);
  const confidence = useShotStore((state) => state.confidence);
  const predictionSource = useShotStore((state) => state.predictionSource);
  const animationPlaying = useShotStore((state) => state.animationPlaying);
  const animationProgress = useShotStore((state) => state.animationProgress);
  const animationStage = useShotStore((state) => state.animationStage);
  const shotOutcome = useShotStore((state) => state.shotOutcome);
  const slowMotion = useShotStore((state) => state.slowMotion);
  const comparisonMode = useShotStore((state) => state.comparisonMode);
  const replayHistory = useShotStore((state) => state.replayHistory);
  const setShooterPosition = useShotStore((state) => state.setShooterPosition);
  const setDefenderPosition = useShotStore((state) => state.setDefenderPosition);
  const setDefenderCount = useShotStore((state) => state.setDefenderCount);
  const setAnimationPlaying = useShotStore(
    (state) => state.setAnimationPlaying,
  );
  const setAnimationProgress = useShotStore(
    (state) => state.setAnimationProgress,
  );
  const setShotOutcome = useShotStore((state) => state.setShotOutcome);
  const setComparisonMode = useShotStore((state) => state.setComparisonMode);
  const setSlowMotion = useShotStore((state) => state.setSlowMotion);
  const saveReplay = useShotStore((state) => state.saveReplay);
  const loadReplay = useShotStore((state) => state.loadReplay);
  const deleteReplay = useShotStore((state) => state.deleteReplay);
  const updateShooterPose = useShotStore((state) => state.updateShooterPose);
  const updateDefenderPose = useShotStore((state) => state.updateDefenderPose);
  const resetShot = useShotStore((state) => state.resetShot);
  const resetPoses = useShotStore((state) => state.resetPoses);
  const shooterJumpTimers = useRef<number[]>([]);
  const defenderJumpTimers = useRef<number[]>([]);
  const savedCurrentCompletion = useRef(false);
  const stageSvgRef = useRef<SVGSVGElement | null>(null);
  const primaryDefender = defenders[0];
  const sharedSimulatorContext = useMemo(
    () =>
      courtStateToSimulatorContext(
        shooter,
        primaryDefender ?? shooter,
        activeDefenderCount,
      ),
    [activeDefenderCount, primaryDefender, shooter],
  );
  const [positionDraft, setPositionDraft] = useState<SimulatorShotContext>(
    () => sharedSimulatorContext,
  );
  const [shotAimTarget, setShotAimTarget] = useState<StagePoint>(RIM);
  const [aimTargetWasEdited, setAimTargetWasEdited] = useState(false);
  const [latchedBlockInfo, setLatchedBlockInfo] = useState<BlockInfo | null>(
    null,
  );
  const [timelinePreviewEnabled, setTimelinePreviewEnabled] = useState(false);
  const previousSharedContext = useRef(sharedSimulatorContext);

  useEffect(() => {
    if (!animationPlaying) {
      return;
    }

    const startProgress = useShotStore.getState().animationProgress;
    const startedAt = performance.now();
    const duration = slowMotion ? 5200 : 2600;
    let lastWrittenProgress = Math.round(startProgress);
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const nextProgress = Math.min(
        startProgress + (elapsed / duration) * (100 - startProgress),
        100,
      );
      const roundedProgress = Math.round(nextProgress);

      if (roundedProgress !== lastWrittenProgress) {
        lastWrittenProgress = roundedProgress;
        setAnimationProgress(roundedProgress, "simulator");
      }

      if (nextProgress >= 100) {
        setAnimationPlaying(false, "simulator");
        return;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [animationPlaying, setAnimationPlaying, setAnimationProgress, slowMotion]);

  useEffect(() => {
    const selectedOutcome = selectShotOutcome({
      makeProbability,
      releaseAngle: shooterPose.releaseAngle,
      shotQuality,
    });

    setShotOutcome(selectedOutcome, "simulator");
  }, [makeProbability, setShotOutcome, shooterPose.releaseAngle, shotQuality]);

  useEffect(() => {
    return () => {
      clearQueuedTimers(shooterJumpTimers);
      clearQueuedTimers(defenderJumpTimers);
    };
  }, []);

  useEffect(() => {
    // Pull fresh sandbox changes into the simulator only when the user has not
    // started editing a local draft. This protects unsent slider changes.
    setPositionDraft((current) =>
      simulatorContextsEqual(current, previousSharedContext.current)
        ? sharedSimulatorContext
        : current,
    );
    previousSharedContext.current = sharedSimulatorContext;
  }, [sharedSimulatorContext]);

  const activeDefenders = defenders.slice(0, activeDefenderCount);
  const activePrimaryDefender = activeDefenders[0];
  const primaryDefenderPose =
    defenderPoses[activePrimaryDefender?.id ?? "d1"] ??
    FALLBACK_DEFENDER_POSE;
  const timelinePoseActive = animationPlaying || timelinePreviewEnabled;
  const displayedShooterPose = useMemo(
    () => {
      if (!timelinePoseActive) {
        return shooterPose;
      }

      const timelinePose = interpolateShooterPose(animationProgress);

      return {
        ...timelinePose,
        handHeight: Math.max(timelinePose.handHeight, shooterPose.handHeight),
        releaseAngle: shooterPose.releaseAngle,
      };
    },
    [animationProgress, shooterPose, timelinePoseActive],
  );
  const displayedDefenderPose = useMemo(
    () =>
      timelinePoseActive
        ? {
            ...primaryDefenderPose,
            ...interpolateDefenderPose(animationProgress),
          }
        : primaryDefenderPose,
    [animationProgress, primaryDefenderPose, timelinePoseActive],
  );
  const activeFrameIndex = getTimelineFrameIndex(animationProgress);
  const recommendedPose = useMemo(
    () => getRecommendedShooterPose(shooterPose),
    [shooterPose],
  );
  const comparison = useMemo(
    () =>
      comparePoses({
        currentEpps: epps,
        currentPose: shooterPose,
        defenderPose: primaryDefenderPose,
        recommendedEpps: Math.max(epps + 0.12, epps * 1.08),
        recommendedPose,
      }),
    [epps, primaryDefenderPose, recommendedPose, shooterPose],
  );
  const mechanicsScore = useMemo(
    () =>
      calculateMechanicsScore({
        defenderPose: primaryDefenderPose,
        pressureLevel,
        shooterPose,
      }),
    [pressureLevel, primaryDefenderPose, shooterPose],
  );
  const currentMetrics = useMemo(
    () => ({
      closestDefenderDistance,
      confidence,
      epps,
      makeProbability,
      predictionSource,
      pressureLevel,
      recommendation,
      shotAngle,
      shotDistance,
      shotQuality,
      shotValue,
      shotZone,
    }),
    [
      closestDefenderDistance,
      confidence,
      epps,
      makeProbability,
      predictionSource,
      pressureLevel,
      recommendation,
      shotAngle,
      shotDistance,
      shotQuality,
      shotValue,
      shotZone,
    ],
  );

  const saveCurrentReplay = useCallback(
    (label?: string) => {
      // Replays persist the complete simulator context needed to restore and
      // reanimate this shot later.
      saveReplay(
        {
          activeDefenderCount,
          defenderPoses,
          defenders,
          label,
          mechanicsScore,
          metrics: currentMetrics,
          shooter,
          shooterPose,
          shotOutcome,
          timelineProgress: animationProgress,
        },
        "simulator",
      );
    },
    [
      activeDefenderCount,
      animationProgress,
      currentMetrics,
      defenderPoses,
      defenders,
      mechanicsScore,
      saveReplay,
      shooter,
      shooterPose,
      shotOutcome,
    ],
  );

  useEffect(() => {
    if (animationProgress >= 100 && !savedCurrentCompletion.current) {
      saveCurrentReplay();
      savedCurrentCompletion.current = true;
    }

    if (animationProgress < 96) {
      savedCurrentCompletion.current = false;
    }
  }, [animationProgress, saveCurrentReplay]);
  const mappedDraft = useMemo(
    () => simulatorContextToCourt(positionDraft),
    [positionDraft],
  );
  const positionsAreSynced = simulatorContextsEqual(
    positionDraft,
    sharedSimulatorContext,
  );
  const shooterStage = useMemo(
    // Preview the draft before it is committed to the shared court store.
    () => mapCourtPointToStage(mappedDraft.shooter.x, mappedDraft.shooter.y),
    [mappedDraft.shooter.x, mappedDraft.shooter.y],
  );
  const defenderStage = useMemo(
    () => mapCourtPointToStage(mappedDraft.defender.x, mappedDraft.defender.y),
    [mappedDraft.defender.x, mappedDraft.defender.y],
  );
  const releasePoint = useMemo(
    () => getReleasePoint({ shooterPose: displayedShooterPose, shooterStage }),
    [displayedShooterPose, shooterStage],
  );
  const effectiveAimTarget = useMemo(
    () =>
      isLegacyRimTarget(shotAimTarget) ||
      (!aimTargetWasEdited && distanceBetweenPoints(shotAimTarget, RIM) > 96)
        ? RIM
        : shotAimTarget,
    [aimTargetWasEdited, shotAimTarget],
  );
  const blockInfo = useMemo(
    () =>
      findBlockPoint({
        defenderPose: displayedDefenderPose,
        defenderStage,
        releaseAngle: displayedShooterPose.releaseAngle,
        releasePoint,
        shotDistance,
        target: effectiveAimTarget,
      }),
    [
      defenderStage,
      displayedDefenderPose,
      displayedShooterPose.releaseAngle,
      effectiveAimTarget,
      releasePoint,
      shotDistance,
    ],
  );
  const shotFlightProgress = Math.min(
    Math.max((animationProgress - 57) / 43, 0),
    1,
  );
  useEffect(() => {
    if (
      (!animationPlaying && !timelinePreviewEnabled) ||
      !blockInfo ||
      shotFlightProgress < blockInfo.progress
    ) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setLatchedBlockInfo((current) => current ?? blockInfo);
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [animationPlaying, blockInfo, shotFlightProgress, timelinePreviewEnabled]);

  const effectiveBlockInfo = latchedBlockInfo;
  const effectiveShotOutcome: ShotOutcomeKind = resolveAimedShotOutcome({
    blockPoint: effectiveBlockInfo?.point ?? null,
    fallbackOutcome: shotOutcome,
    makeProbability,
    target: effectiveAimTarget,
  });
  const sendPositionDraftToSandbox = useCallback(() => {
    // Commit all mapped values together from the user's perspective. Each store
    // action is marked as simulator-originated for traceability.
    setShooterPosition(mappedDraft.shooter, "simulator");
    setDefenderPosition(
      primaryDefender?.id ?? "d1",
      mappedDraft.defender,
      "simulator",
    );
    setDefenderCount(mappedDraft.defenderCount, "simulator");
  }, [
    mappedDraft,
    primaryDefender?.id,
    setDefenderCount,
    setDefenderPosition,
    setShooterPosition,
  ]);
  const commitSimulatorContext = useCallback(
    (context: SimulatorShotContext) => {
      const nextDraft = normalizeSimulatorDraft(context);
      const nextCourtContext = simulatorContextToCourt(nextDraft);

      setPositionDraft(nextDraft);
      setShooterPosition(nextCourtContext.shooter, "simulator");
      setDefenderPosition(
        primaryDefender?.id ?? "d1",
        nextCourtContext.defender,
        "simulator",
      );
      setDefenderCount(nextCourtContext.defenderCount, "simulator");
    },
    [
      primaryDefender?.id,
      setDefenderCount,
      setDefenderPosition,
      setShooterPosition,
    ],
  );
  const moveStagePlayer = useCallback(
    (player: "defender" | "shooter", point: StagePoint) => {
      const courtPoint = mapStagePointToCourt(point);
      const nextContext =
        player === "shooter"
          ? courtStateToSimulatorContext(
              courtPoint,
              mappedDraft.defender,
              positionDraft.defenderCount,
            )
          : courtStateToSimulatorContext(
              mappedDraft.shooter,
              courtPoint,
              positionDraft.defenderCount,
            );

      setAnimationPlaying(false, "simulator");
      setTimelinePreviewEnabled(false);
      setLatchedBlockInfo(null);
      clearQueuedTimers(shooterJumpTimers);
      clearQueuedTimers(defenderJumpTimers);
      setAnimationProgress(0, "simulator");
      updateShooterPose(
        { isAirborne: false, jumpHeight: 0, verticalOffset: 0 },
        "simulator",
      );
      updateDefenderPose(
        activePrimaryDefender?.id ?? "d1",
        { isAirborne: false, jumpHeight: 0, verticalOffset: 0 },
        "simulator",
      );
      commitSimulatorContext(nextContext);
    },
    [
      activePrimaryDefender?.id,
      commitSimulatorContext,
      mappedDraft.defender,
      mappedDraft.shooter,
      positionDraft.defenderCount,
      setAnimationPlaying,
      setAnimationProgress,
      updateDefenderPose,
      updateShooterPose,
    ],
  );
  const playTimeline = useCallback(() => {
    setLatchedBlockInfo(null);

    if (animationProgress >= 100) {
      setAnimationProgress(0, "simulator");
    }

    setTimelinePreviewEnabled(true);
    setAnimationPlaying(true, "simulator");
  }, [
    animationProgress,
    setAnimationPlaying,
    setAnimationProgress,
  ]);
  const replayTimeline = useCallback(() => {
    setLatchedBlockInfo(null);
    setTimelinePreviewEnabled(true);
    setAnimationProgress(0, "simulator");
    setAnimationPlaying(true, "simulator");
  }, [setAnimationPlaying, setAnimationProgress]);
  const showTimelinePreview = useCallback(
    (progress: number) => {
      setTimelinePreviewEnabled(true);
      setAnimationProgress(progress, "simulator");
    },
    [setAnimationProgress],
  );
  const leaveTimelinePreview = useCallback(() => {
    setTimelinePreviewEnabled(false);
    setLatchedBlockInfo(null);
  }, []);
  const changeShotArcHeight = useCallback(
    (point: StagePoint) => {
      const distanceLift = Math.min(Math.max(shotDistance, 8), 32) * 3.8;
      const targetY = Math.min(releasePoint.y, effectiveAimTarget.y);
      const nextReleaseAngle =
        (targetY - point.y - 48 - distanceLift) / 2.1 + 20;

      setAnimationPlaying(false, "simulator");
      setTimelinePreviewEnabled(false);
      setLatchedBlockInfo(null);
      updateShooterPose(
        { releaseAngle: clampValue(nextReleaseAngle, 20, 92) },
        "simulator",
      );
    },
    [
      releasePoint.y,
      effectiveAimTarget.y,
      setAnimationPlaying,
      shotDistance,
      updateShooterPose,
    ],
  );
  const changeShotAimTarget = useCallback(
    (point: StagePoint) => {
      setAnimationPlaying(false, "simulator");
      setTimelinePreviewEnabled(false);
      setLatchedBlockInfo(null);
      setAimTargetWasEdited(true);
      setShotAimTarget({
        x: clampValue(point.x, STAGE_COURT_MIN_X, STAGE_WIDTH - 58),
        y: clampValue(point.y, 72, FLOOR_Y - 26),
      });
    },
    [setAnimationPlaying],
  );
  const handlePosePointDrag = useCallback(
    (drag: StickmanPoseDrag) => {
      setAnimationPlaying(false, "simulator");
      setTimelinePreviewEnabled(false);
      setLatchedBlockInfo(null);

      if (drag.type === "shooter") {
        updateShooterPose(
          getShooterPosePatchFromDrag(shooterPose, drag),
          "simulator",
        );
        return;
      }

      updateDefenderPose(
        activePrimaryDefender?.id ?? "d1",
        getDefenderPosePatchFromDrag(primaryDefenderPose, drag),
        "simulator",
      );
    },
    [
      activePrimaryDefender?.id,
      primaryDefenderPose,
      setAnimationPlaying,
      shooterPose,
      updateDefenderPose,
      updateShooterPose,
    ],
  );
  const resetSharedShot = useCallback(() => {
    // Zustand writes synchronously, so reload the reset coordinates into the
    // simulator draft immediately after resetting the shared shot.
    resetShot("simulator");
    setTimelinePreviewEnabled(false);
    setLatchedBlockInfo(null);
    setAimTargetWasEdited(false);
    setShotAimTarget(RIM);
    const resetState = useShotStore.getState();
    setPositionDraft(
      courtStateToSimulatorContext(
        resetState.shooter,
        resetState.defenders[0] ?? resetState.shooter,
        resetState.activeDefenderCount,
      ),
    );
  }, [resetShot]);
  const runShooterJump = useCallback(() => {
    // A jump shot is staged as crouch/takeoff, peak release, and landing.
    // It writes to the same Zustand pose state that the sliders control.
    clearQueuedTimers(shooterJumpTimers);
    setAnimationPlaying(false, "simulator");
    setTimelinePreviewEnabled(false);
    setLatchedBlockInfo(null);
    setAnimationProgress(47, "simulator");
    updateShooterPose(
      {
        isAirborne: true,
        jumpHeight: 3.8,
        kneeBend: 18,
        verticalOffset: 0.45,
      },
      "simulator",
    );
    queueElevationStep(shooterJumpTimers, 240, () => {
      setAnimationProgress(62, "simulator");
      updateShooterPose(
        {
          guideHandAngle: 30,
          isAirborne: true,
          jumpHeight: SHOOTER_PEAK_ELEVATION.jumpHeight,
          kneeBend: 8,
          shootingArmAngle: 76,
          verticalOffset: SHOOTER_PEAK_ELEVATION.verticalOffset,
        },
        "simulator",
      );
    });
    queueElevationStep(shooterJumpTimers, 760, () => {
      updateShooterPose(
        {
          isAirborne: true,
          jumpHeight: 4,
          kneeBend: 20,
          verticalOffset: 0.45,
        },
        "simulator",
      );
    });
    queueElevationStep(shooterJumpTimers, 1080, () => {
      updateShooterPose(
        {
          isAirborne: false,
          jumpHeight: 0,
          verticalOffset: 0,
        },
        "simulator",
      );
    });
  }, [setAnimationPlaying, setAnimationProgress, updateShooterPose]);

  const runDefenderContestJump = useCallback(() => {
    // Defender contest uses the same elevation sequence, with a raised hand
    // and contest height emphasized at the hang point.
    clearQueuedTimers(defenderJumpTimers);
    setAnimationPlaying(false, "simulator");
    setTimelinePreviewEnabled(false);
    setLatchedBlockInfo(null);
    updateDefenderPose(
      activePrimaryDefender?.id ?? "d1",
        {
          armRaise: 78,
          isAirborne: true,
          jumpHeight: 5.2,
          kneeBend: 14,
          verticalOffset: 0.54,
        },
      "simulator",
    );
    queueElevationStep(defenderJumpTimers, 220, () => {
      updateDefenderPose(
        activePrimaryDefender?.id ?? "d1",
        {
          armRaise: 96,
          contestHeight: 10.8,
          isAirborne: true,
          jumpHeight: DEFENDER_PEAK_ELEVATION.jumpHeight,
          kneeBend: 6,
          verticalOffset: DEFENDER_PEAK_ELEVATION.verticalOffset,
        },
        "simulator",
      );
    });
    queueElevationStep(defenderJumpTimers, 740, () => {
      updateDefenderPose(
        activePrimaryDefender?.id ?? "d1",
        {
          armRaise: 80,
          isAirborne: true,
          jumpHeight: 5,
          kneeBend: 16,
          verticalOffset: 0.52,
        },
        "simulator",
      );
    });
    queueElevationStep(defenderJumpTimers, 1060, () => {
      updateDefenderPose(
        activePrimaryDefender?.id ?? "d1",
        {
          isAirborne: false,
          jumpHeight: 0,
          verticalOffset: 0,
        },
        "simulator",
      );
    });
  }, [activePrimaryDefender?.id, setAnimationPlaying, updateDefenderPose]);

  const resetElevation = useCallback(() => {
    // Reset elevation only lands the players; it leaves user-tuned angles intact.
    clearQueuedTimers(shooterJumpTimers);
    clearQueuedTimers(defenderJumpTimers);
    setAnimationPlaying(false, "simulator");
    setTimelinePreviewEnabled(false);
    setLatchedBlockInfo(null);
    updateShooterPose(
      { isAirborne: false, jumpHeight: 0, verticalOffset: 0 },
      "simulator",
    );
    updateDefenderPose(
      activePrimaryDefender?.id ?? "d1",
      { isAirborne: false, jumpHeight: 0, verticalOffset: 0 },
      "simulator",
    );
  }, [
    activePrimaryDefender?.id,
    setAnimationPlaying,
    updateDefenderPose,
    updateShooterPose,
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_370px]">
      <section className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl xl:sticky xl:top-5 xl:self-start">
        <div className="flex flex-col gap-3 border-b border-white/10 bg-black/25 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-orange-300/25 bg-orange-500/10 text-orange-100">
              <Activity className="size-5" />
            </span>
            <div>
              <p className="text-sm font-black text-white">
                Phase 5 Mechanics Stage
              </p>
              <p className="text-xs text-slate-400">
                {shotZone} / {pressureLevel} / {predictionSource}
              </p>
            </div>
          </div>
          <SyncBadge isSynced={positionsAreSynced} />
          <ShotArcControls
            activeStage={animationStage}
            frameCount={SHOOTING_ANIMATION_KEYFRAMES.length}
            frameIndex={activeFrameIndex}
            isPlaying={animationPlaying}
            isSlowMotion={slowMotion}
            timeline={animationProgress}
            onNextFrame={() =>
              showTimelinePreview(
                nextFrameProgress(animationProgress),
              )
            }
            onPause={() => setAnimationPlaying(false, "simulator")}
            onPlay={playTimeline}
            onPreviousFrame={() =>
              showTimelinePreview(
                previousFrameProgress(animationProgress),
              )
            }
            onReset={() => {
              replayTimeline();
            }}
            onTimelineChange={showTimelinePreview}
            onToggleSlowMotion={() => setSlowMotion(!slowMotion, "simulator")}
          />
        </div>

        <SimulatorStage
          comparisonMode={comparisonMode}
          defenderPose={displayedDefenderPose}
          defenderStage={defenderStage}
          aimTarget={effectiveAimTarget}
          blockPoint={effectiveBlockInfo?.point ?? null}
          blockProgress={effectiveBlockInfo?.progress}
          makeProbability={makeProbability}
          effectiveOutcome={effectiveShotOutcome}
          epps={epps}
          onAimTargetDrag={changeShotAimTarget}
          onArcControlDrag={changeShotArcHeight}
          onPosePointDrag={handlePosePointDrag}
          recommendation={recommendation}
          recommendedPose={recommendedPose}
          shooterPose={displayedShooterPose}
          shooterStage={shooterStage}
          shotDistance={shotDistance}
          shotQuality={shotQuality}
          isPlaying={animationPlaying}
          onPlayerDrag={moveStagePlayer}
          stageRef={stageSvgRef}
          timeline={animationProgress}
        />

        <div className="grid gap-3 border-t border-white/10 bg-black/20 p-4 text-sm md:grid-cols-4">
          <MetricPill
            icon={<Target className="size-4" />}
            label="Zone"
            tone={shotZone === "Three Point" ? "green" : "orange"}
            value={shotZone}
          />
          <MetricPill
            icon={<Shield className="size-4" />}
            label="Pressure"
            tone={pressureLevel.includes("Tight") ? "red" : "neutral"}
            value={pressureLevel}
          />
          <MetricPill
            icon={<Gauge className="size-4" />}
            label="Make Prob"
            tone={makeProbability >= 0.5 ? "green" : "neutral"}
            value={`${(makeProbability * 100).toFixed(1)}%`}
          />
          <MetricPill
            icon={<Activity className="size-4" />}
            label="EPPS"
            tone={epps >= 1.1 ? "green" : epps >= 0.85 ? "orange" : "red"}
            value={epps.toFixed(2)}
          />
        </div>
      </section>

      <aside className="grid gap-4 xl:sticky xl:top-5 xl:max-h-[calc(100vh-2.5rem)] xl:self-start xl:overflow-y-auto xl:pr-1">
        <PoseControls
          onDefenderContestJump={runDefenderContestJump}
          onManualPoseEdit={leaveTimelinePreview}
          onResetElevation={resetElevation}
          onShooterJump={runShooterJump}
        />

        <PoseAnalytics />

        <ComparisonPanel
          comparison={comparison}
          enabled={comparisonMode}
          onToggle={() => setComparisonMode(!comparisonMode, "simulator")}
        />

        <ReplayHistoryPanel
          replayHistory={replayHistory}
          onDeleteReplay={(replayId) => deleteReplay(replayId, "simulator")}
          onLoadReplay={(replayId) => {
            loadReplay(replayId, "replay");
            setLatchedBlockInfo(null);
            setTimelinePreviewEnabled(true);
            setAnimationProgress(0, "replay");
            setAnimationPlaying(true, "replay");
          }}
          onSaveReplay={() =>
            saveCurrentReplay(`Shot #${replayHistory.length + 1}`)
          }
        />

        <ExportSimulationPanel
          mechanicsScore={mechanicsScore}
          metrics={currentMetrics}
          shooterPose={shooterPose}
          stageRef={stageSvgRef}
          timeline={animationProgress}
        />

        <AdvancedSimulatorInsights />

        <ShotInfoPanel
          confidence={confidence}
          epps={epps}
          makeProbability={makeProbability}
          predictionSource={predictionSource}
          pressureLevel={pressureLevel}
          recommendation={recommendation}
          shotAngle={shotAngle}
          shotDistance={shotDistance}
          shotQuality={shotQuality}
          shotZone={shotZone}
        />

        <PositionControlPanel
          draft={positionDraft}
          isSynced={positionsAreSynced}
          mappedCourtContext={mappedDraft}
          onDraftChange={setPositionDraft}
          onResetShot={resetSharedShot}
          onSendToSandbox={sendPositionDraftToSandbox}
          resetPoses={(source) => {
            leaveTimelinePreview();
            resetPoses(source);
          }}
        />
      </aside>
    </div>
  );
}

function SimulatorStage({
  aimTarget,
  blockPoint,
  blockProgress,
  comparisonMode,
  defenderPose,
  defenderStage,
  epps,
  effectiveOutcome,
  isPlaying,
  makeProbability,
  onAimTargetDrag,
  onArcControlDrag,
  onPlayerDrag,
  onPosePointDrag,
  recommendation,
  recommendedPose,
  shooterPose,
  shooterStage,
  shotDistance,
  shotQuality,
  stageRef,
  timeline,
}: {
  aimTarget: StagePoint;
  blockPoint?: StagePoint | null;
  blockProgress?: number;
  comparisonMode: boolean;
  defenderPose: DefenderPoseState;
  defenderStage: StagePoint;
  epps: number;
  effectiveOutcome: ShotOutcomeKind;
  isPlaying: boolean;
  makeProbability: number;
  onAimTargetDrag: (point: StagePoint) => void;
  onArcControlDrag: (point: StagePoint) => void;
  onPlayerDrag: (player: "defender" | "shooter", point: StagePoint) => void;
  onPosePointDrag: (drag: StickmanPoseDrag) => void;
  recommendation: string;
  recommendedPose: ShooterPoseState;
  shooterPose: ShooterPoseState;
  shooterStage: StagePoint;
  shotDistance: number;
  shotQuality: SharedShotQuality;
  stageRef: RefObject<SVGSVGElement | null>;
  timeline: number;
}) {
  const [draggedPlayer, setDraggedPlayer] = useState<"defender" | "shooter" | null>(
    null,
  );

  const beginPlayerDrag = (
    player: "defender" | "shooter",
    event: PointerEvent<SVGGElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggedPlayer(player);
    moveDraggedPlayer(player, event);
  };
  const moveDraggedPlayer = (
    player: "defender" | "shooter",
    event: PointerEvent<SVGGElement>,
  ) => {
    const point = getPointerStagePoint(event);

    if (point) {
      onPlayerDrag(player, point);
    }
  };
  const continuePlayerDrag = (event: PointerEvent<SVGGElement>) => {
    if (!draggedPlayer) {
      return;
    }

    moveDraggedPlayer(draggedPlayer, event);
  };
  const endPlayerDrag = (event: PointerEvent<SVGGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDraggedPlayer(null);
  };

  // Stage is an SVG prototype, not a physics engine; it visualizes shared state.
  return (
    <div className="relative bg-[#10160f]">
      <svg
        ref={stageRef}
        className="block h-[440px] w-full sm:h-[560px] xl:h-[680px] 2xl:h-[740px]"
        viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
        role="img"
        aria-label="2D stickman basketball simulator with shooter, defender, rim, and ball arc"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="sim-floor" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#1f3a24" />
            <stop offset="0.55" stopColor="#132116" />
            <stop offset="1" stopColor="#0b0f0d" />
          </linearGradient>
          <radialGradient id="sim-court-light" cx="48%" cy="18%" r="74%">
            <stop offset="0" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="0.42" stopColor="rgba(34,197,94,0.08)" />
            <stop offset="1" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <filter id="sim-orange-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="sim-green-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="sim-sky-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="url(#sim-floor)" />
        <rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="url(#sim-court-light)" />
        <CrowdBlurBackground />
        <CourtParticles />
        <CourtBackground />
        <Basket />

        <ShotArc
          aimTarget={aimTarget}
          blockPoint={blockPoint}
          blockProgress={blockProgress}
          epps={epps}
          makeProbability={makeProbability}
          onAimTargetDrag={onAimTargetDrag}
          onArcControlDrag={onArcControlDrag}
          outcome={effectiveOutcome}
          recommendation={recommendation}
          releaseAngle={shooterPose.releaseAngle}
          rim={RIM}
          shooterPose={shooterPose}
          shooterStage={shooterStage}
          shotDistance={shotDistance}
          shotQuality={shotQuality}
          isPlaying={isPlaying}
          timeline={timeline}
        />

        <DraggablePlayerShell
          isDragging={draggedPlayer === "shooter"}
          label="Move shooter"
          onPointerDown={(event) => beginPlayerDrag("shooter", event)}
          onPointerMove={continuePlayerDrag}
          onPointerUp={endPlayerDrag}
        >
          <StickmanPlayer
            color="#fb923c"
            glowFilter="url(#sim-orange-glow)"
            guideHandAngle={shooterPose.guideHandAngle}
            handHeight={shooterPose.handHeight}
            isAnimating={isPlaying}
            isAirborne={shooterPose.isAirborne}
            jumpHeight={shooterPose.jumpHeight}
            kneeBend={shooterPose.kneeBend}
            label="Shooter"
            leftLegAngle={shooterPose.leftLegAngle}
            onPosePointDrag={onPosePointDrag}
            releaseAngle={shooterPose.releaseAngle}
            rightLegAngle={shooterPose.rightLegAngle}
            shootingArmAngle={shooterPose.shootingArmAngle}
            torsoAngle={shooterPose.torsoAngle}
            type="shooter"
            verticalOffset={shooterPose.verticalOffset}
            x={shooterStage.x}
            y={shooterStage.y}
          />
        </DraggablePlayerShell>
        {comparisonMode ? (
          <StickmanPlayer
            color="#38bdf8"
            glowFilter="url(#sim-sky-glow)"
            guideHandAngle={recommendedPose.guideHandAngle}
            handHeight={recommendedPose.handHeight}
            isAnimating={isPlaying}
            isAirborne={recommendedPose.isAirborne}
            jumpHeight={recommendedPose.jumpHeight}
            kneeBend={recommendedPose.kneeBend}
            label="Recommended"
            leftLegAngle={recommendedPose.leftLegAngle}
            releaseAngle={recommendedPose.releaseAngle}
            rightLegAngle={recommendedPose.rightLegAngle}
            shootingArmAngle={recommendedPose.shootingArmAngle}
            torsoAngle={recommendedPose.torsoAngle}
            type="shooter"
            verticalOffset={recommendedPose.verticalOffset}
            x={Math.min(shooterStage.x + 150, RIM.x - 170)}
            y={shooterStage.y}
          />
        ) : null}
        <DraggablePlayerShell
          isDragging={draggedPlayer === "defender"}
          label="Move defender"
          onPointerDown={(event) => beginPlayerDrag("defender", event)}
          onPointerMove={continuePlayerDrag}
          onPointerUp={endPlayerDrag}
        >
          <StickmanPlayer
            armRaise={defenderPose.armRaise}
            contestHeight={defenderPose.contestHeight}
            color="#4ade80"
            glowFilter="url(#sim-green-glow)"
            isAnimating={isPlaying}
            isAirborne={defenderPose.isAirborne}
            jumpHeight={defenderPose.jumpHeight}
            kneeBend={defenderPose.kneeBend}
            label="Defender"
            leftLegAngle={-defenderPose.stanceWidth * 7 + defenderPose.leanAngle * 0.2}
            onPosePointDrag={onPosePointDrag}
            rightLegAngle={defenderPose.stanceWidth * 7 + defenderPose.leanAngle * 0.2}
            torsoAngle={defenderPose.torsoAngle + defenderPose.leanAngle}
            type="defender"
            verticalOffset={defenderPose.verticalOffset}
            x={defenderStage.x}
            y={defenderStage.y}
          />
        </DraggablePlayerShell>

      </svg>
    </div>
  );
}

function DraggablePlayerShell({
  children,
  isDragging,
  label,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  children: ReactNode;
  isDragging: boolean;
  label: string;
  onPointerDown: (event: PointerEvent<SVGGElement>) => void;
  onPointerMove: (event: PointerEvent<SVGGElement>) => void;
  onPointerUp: (event: PointerEvent<SVGGElement>) => void;
}) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      className="cursor-grab outline-none"
      onPointerCancel={onPointerUp}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
    >
      {isDragging ? (
        <g opacity="0.95">
          <rect
            x="702"
            y="34"
            width="46"
            height="36"
            rx="8"
            fill="rgba(0,0,0,0.56)"
            stroke="rgba(255,255,255,0.16)"
          />
          <Grip x="718" y="43" width="18" height="18" color="#fed7aa" />
        </g>
      ) : null}
      {children}
    </g>
  );
}

function CourtBackground() {
  // Draws a simple side-view court floor and guide lines behind the players.
  return (
    <g>
      <rect
        x="44"
        y={FLOOR_Y}
        width={STAGE_WIDTH - 88}
        height="54"
        rx="8"
        fill="rgba(190,123,61,0.58)"
        stroke="rgba(255,255,255,0.14)"
      />
      <path
        d={`M 74 ${FLOOR_Y}H${STAGE_WIDTH - 74}M160 ${FLOOR_Y}v54M460 ${FLOOR_Y}v54M760 ${FLOOR_Y}v54M960 ${FLOOR_Y}v54`}
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="2"
      />
      <path
        d={`M80 ${FLOOR_Y - 56}C226 ${FLOOR_Y - 96} 358 ${FLOOR_Y - 92} 496 ${FLOOR_Y - 58}S730 ${FLOOR_Y - 18} 852 ${FLOOR_Y - 60}S990 ${FLOOR_Y - 88} ${STAGE_WIDTH - 70} ${FLOOR_Y - 50}`}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeDasharray="9 16"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </g>
  );
}

function CrowdBlurBackground() {
  // Blurred crowd bands add depth while staying abstract enough to avoid
  // distracting from the mechanics stage.
  return (
    <g opacity="0.34" filter="url(#sim-green-glow)">
      <rect x="34" y="46" width={STAGE_WIDTH - 68} height="74" rx="18" fill="rgba(15,23,42,0.72)" />
      {Array.from({ length: 22 }).map((_, index) => (
        <circle
          key={`crowd-${index}`}
          cx={70 + index * 45}
          cy={72 + (index % 3) * 13}
          r={8 + (index % 4)}
          fill={index % 2 ? "rgba(56,189,248,0.28)" : "rgba(251,146,60,0.24)"}
        />
      ))}
    </g>
  );
}

function CourtParticles() {
  // Small floating dust highlights make jumps and rim hits feel less static.
  return (
    <g opacity="0.45">
      {Array.from({ length: 20 }).map((_, index) => (
        <circle
          key={`particle-${index}`}
          cx={72 + index * 41}
          cy={164 + ((index * 29) % 188)}
          r={index % 3 === 0 ? 2.4 : 1.4}
          fill={index % 2 ? "#bbf7d0" : "#fed7aa"}
        />
      ))}
    </g>
  );
}

function Basket() {
  // Rim and backboard stay fixed for now while poses and shot arc update.
  return (
    <g>
      <line
        x1={RIM.x + 36}
        x2={RIM.x + 36}
        y1={RIM.y - 90}
        y2={RIM.y + 33}
        stroke="rgba(255,255,255,0.82)"
        strokeLinecap="round"
        strokeWidth="8"
      />
      <rect
        x={RIM.x - 2}
        y={RIM.y - 68}
        width="70"
        height="48"
        rx="4"
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(255,255,255,0.48)"
        strokeWidth="4"
      />
      <ellipse
        cx={RIM.x}
        cy={RIM.y}
        rx="34"
        ry="10"
        fill="none"
        stroke="#fb923c"
        strokeWidth="8"
        filter="url(#sim-orange-glow)"
      />
      <path
        d={`M ${RIM.x - 27} ${RIM.y + 5}c15 24 43 24 56 0`}
        fill="none"
        stroke="rgba(255,255,255,0.34)"
        strokeWidth="2"
      />
    </g>
  );
}

function ComparisonPanel({
  comparison,
  enabled,
  onToggle,
}: {
  comparison: ReturnType<typeof comparePoses>;
  enabled: boolean;
  onToggle: () => void;
}) {
  // Frame comparison mode keeps the current and recommended forms animated on
  // the same timeline while this panel explains the key differences.
  return (
    <section className="rounded-lg border border-sky-300/20 bg-sky-400/10 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-100/75">
            Frame Comparison Mode
          </p>
          <p className="mt-1 text-sm font-black text-white">
            Current Shot vs Recommended Shot
          </p>
        </div>
        <button
          type="button"
          aria-pressed={enabled}
          onClick={onToggle}
          className={`min-h-9 rounded-lg border px-3 text-xs font-black transition ${
            enabled
              ? "border-sky-200/40 bg-sky-300/20 text-sky-50"
              : "border-white/10 bg-black/25 text-slate-300 hover:border-sky-200/30"
          }`}
        >
          {enabled ? "On" : "Off"}
        </button>
      </div>
      <div className="mt-4 grid gap-2">
        <InfoRow
          label="EPPS Difference"
          value={`${comparison.eppsDifference >= 0 ? "+" : ""}${comparison.eppsDifference.toFixed(2)}`}
        />
        <InfoRow
          label="Jump Difference"
          value={`${comparison.jumpDifference >= 0 ? "+" : ""}${comparison.jumpDifference.toFixed(1)}`}
        />
        <InfoRow
          label="Release Difference"
          value={`${comparison.releaseDifference >= 0 ? "+" : ""}${comparison.releaseDifference.toFixed(1)} deg`}
        />
        <InfoRow
          label="Contest Difference"
          value={`${comparison.contestDifference >= 0 ? "+" : ""}${comparison.contestDifference}`}
        />
      </div>
    </section>
  );
}

function ReplayHistoryPanel({
  onDeleteReplay,
  onLoadReplay,
  onSaveReplay,
  replayHistory,
}: {
  onDeleteReplay: (replayId: string) => void;
  onLoadReplay: (replayId: string) => void;
  onSaveReplay: () => void;
  replayHistory: ShotReplayEntry[];
}) {
  // Replays are lightweight local snapshots. Loading one writes its saved
  // positions, poses, metrics, outcome, and timeline frame back to the store.
  return (
    <section className="rounded-lg border border-white/10 bg-black/30 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Shot Replay System
          </p>
          <p className="mt-1 text-sm font-black text-white">
            Saved timeline shots
          </p>
        </div>
        <button
          type="button"
          onClick={onSaveReplay}
          className="min-h-9 rounded-lg border border-orange-300/25 bg-orange-500/10 px-3 text-xs font-black text-orange-100 transition hover:bg-orange-500/20"
        >
          Save
        </button>
      </div>

      <div className="mt-4 grid gap-2">
        {replayHistory.length ? (
          replayHistory.map((replay) => (
            <div
              key={replay.id}
              className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-3"
            >
              <button
                type="button"
                onClick={() => onLoadReplay(replay.id)}
                className="flex min-h-10 items-center justify-between gap-3 text-left"
              >
                <span>
                  <span className="block text-sm font-black text-white">
                    {replay.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(replay.createdAt).toLocaleString()} / EPPS{" "}
                    {replay.metrics.epps.toFixed(2)}
                  </span>
                </span>
                <span className="rounded-md border border-green-300/25 bg-green-400/10 px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-green-100">
                  Replay
                </span>
              </button>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-400">
                  Form {replay.mechanicsScore.overallForm} / {replay.shotOutcome}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteReplay(replay.id)}
                  className="text-xs font-black text-red-200 transition hover:text-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-slate-400">
            Finished autoplay shots will appear here automatically.
          </p>
        )}
      </div>
    </section>
  );
}

function ExportSimulationPanel({
  mechanicsScore,
  metrics,
  shooterPose,
  stageRef,
  timeline,
}: {
  mechanicsScore: ReturnType<typeof calculateMechanicsScore>;
  metrics: {
    closestDefenderDistance: number;
    confidence: string;
    epps: number;
    makeProbability: number;
    predictionSource: string;
    pressureLevel: string;
    recommendation: string;
    shotAngle: number;
    shotDistance: number;
    shotQuality: string;
    shotValue: number;
    shotZone: string;
  };
  shooterPose: ShooterPoseState;
  stageRef: RefObject<SVGSVGElement | null>;
  timeline: number;
}) {
  const reportLines = [
    "ShotOptix Simulation Report",
    `Court Position: ${metrics.shotZone}, ${metrics.shotDistance.toFixed(1)} ft, ${metrics.shotAngle.toFixed(1)} deg`,
    `Prediction: ${(metrics.makeProbability * 100).toFixed(1)}% make probability`,
    `EPPS: ${metrics.epps.toFixed(2)}`,
    `Pose: release ${shooterPose.releaseAngle.toFixed(1)} deg, knee ${shooterPose.kneeBend.toFixed(1)}, jump ${shooterPose.jumpHeight.toFixed(1)}`,
    `Recommendation: ${metrics.recommendation}`,
    `Frame Timeline: ${timeline}%`,
    `Mechanics Score: overall ${mechanicsScore.overallForm}, balance ${mechanicsScore.balance}, release ${mechanicsScore.release}`,
  ];

  async function exportPng() {
    const svg = stageRef.current;

    if (!svg) {
      return;
    }

    const serializedSvg = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([serializedSvg], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = STAGE_WIDTH;
      canvas.height = STAGE_HEIGHT;
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(url);
        return;
      }

      context.fillStyle = "#10160f";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, "shotoptix-simulation.png");
        }
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    image.src = url;
  }

  function exportJson() {
    downloadBlob(
      new Blob(
        [
          JSON.stringify(
            {
              frameTimeline: timeline,
              mechanicsScore,
              metrics,
              pose: shooterPose,
              recommendation: metrics.recommendation,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      "shotoptix-simulation.json",
    );
  }

  function exportReport() {
    downloadBlob(
      new Blob([reportLines.join("\n")], { type: "text/plain;charset=utf-8" }),
      "shotoptix-shot-report.txt",
    );
  }

  function exportPdf() {
    downloadBlob(
      new Blob([buildSimplePdf(reportLines)], { type: "application/pdf" }),
      "shotoptix-shot-report.pdf",
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-black/30 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        Export Simulation
      </p>
      <p className="mt-1 text-sm font-black text-white">
        Reports and analytics
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <ExportButton label="PNG" onClick={exportPng} />
        <ExportButton label="PDF" onClick={exportPdf} />
        <ExportButton label="JSON" onClick={exportJson} />
        <ExportButton label="Shot Report" onClick={exportReport} />
      </div>
    </section>
  );
}

function ExportButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-black text-slate-200 transition hover:border-green-300/35 hover:text-green-100"
    >
      {label}
    </button>
  );
}

function ShotInfoPanel({
  confidence,
  epps,
  makeProbability,
  predictionSource,
  pressureLevel,
  recommendation,
  shotAngle,
  shotDistance,
  shotQuality,
  shotZone,
}: {
  confidence: string;
  epps: number;
  makeProbability: number;
  predictionSource: string;
  pressureLevel: string;
  recommendation: string;
  shotAngle: number;
  shotDistance: number;
  shotQuality: SharedShotQuality;
  shotZone: string;
}) {
  // Right-side panel mirrors the latest global shot result from the store.
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Shot Information
          </p>
          <h2 className="mt-1 text-xl font-black text-white">{shotQuality}</h2>
        </div>
        <span className={`rounded-md border px-2.5 py-1 text-xs font-black ${qualityBadge[shotQuality]}`}>
          {predictionSource}
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        <InfoRow label="Make Probability" value={`${(makeProbability * 100).toFixed(1)}%`} />
        <InfoRow label="EPPS" value={epps.toFixed(2)} />
        <InfoRow label="Zone" value={shotZone} />
        <InfoRow label="Pressure" value={pressureLevel} />
        <InfoRow label="Distance" value={`${shotDistance.toFixed(1)} ft`} />
        <InfoRow label="Angle" value={`${shotAngle.toFixed(1)} deg`} />
        <InfoRow label="Confidence" value={confidence} />
      </div>
      <div className="mt-4 rounded-lg border border-green-300/20 bg-green-400/10 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-200">
          Recommendation
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-200">
          {recommendation}
        </p>
      </div>
    </section>
  );
}

function PositionControlPanel({
  draft,
  isSynced,
  mappedCourtContext,
  onDraftChange,
  onResetShot,
  onSendToSandbox,
  resetPoses,
}: {
  draft: SimulatorShotContext;
  isSynced: boolean;
  mappedCourtContext: MappedCourtContext;
  onDraftChange: Dispatch<SetStateAction<SimulatorShotContext>>;
  onResetShot: () => void;
  onSendToSandbox: () => void;
  resetPoses: (source?: "sandbox" | "simulator" | "backend" | "system") => void;
}) {
  const shotDistanceLimits = getShotDistanceLimits(draft.shooterX);
  const defenderDistanceLimits = getDefenderDistanceLimits(
    mappedCourtContext.shooter,
    draft.defenderX,
  );

  const updateDraft = (patch: Partial<SimulatorShotContext>) => {
    // Normalize dependent distance limits whenever a horizontal slider changes.
    onDraftChange((current) =>
      normalizeSimulatorDraft({
        ...current,
        ...patch,
      }),
    );
  };

  return (
    <section className="rounded-lg border border-white/10 bg-black/30 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Court Sync Controls
          </p>
          <p className="mt-1 text-sm font-black text-white">
            Simulator shot context
          </p>
        </div>
        <div className="flex gap-2">
          <IconButton label="Reset Shot" onClick={onResetShot}>
            <RotateCcw className="size-4" />
          </IconButton>
          <IconButton label="Reset Poses" onClick={() => resetPoses("simulator")}>
            <RotateCcw className="size-4" />
          </IconButton>
        </div>
      </div>
      <div className="mt-4 grid gap-4">
        <RangeControl
          label="Shooter horizontal position"
          max={50}
          min={0}
          step={0.1}
          unit="ft"
          value={draft.shooterX}
          onChange={(shooterX) => updateDraft({ shooterX })}
        />
        <RangeControl
          label="Shot distance from basket"
          max={shotDistanceLimits.max}
          min={shotDistanceLimits.min}
          step={0.1}
          unit="ft"
          value={draft.shotDistance}
          onChange={(shotDistance) => updateDraft({ shotDistance })}
        />
        <RangeControl
          label="Defender horizontal position"
          max={50}
          min={0}
          step={0.1}
          unit="ft"
          value={draft.defenderX}
          onChange={(defenderX) => updateDraft({ defenderX })}
        />
        <RangeControl
          label="Defender distance from shooter"
          max={defenderDistanceLimits.max}
          min={defenderDistanceLimits.min}
          step={0.1}
          unit="ft"
          value={draft.defenderDistance}
          onChange={(defenderDistance) => updateDraft({ defenderDistance })}
        />

        <div className="grid gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Active defenders
          </span>
          <div className="grid grid-cols-2 gap-2">
            {([1, 2] as const).map((count) => (
              <button
                key={count}
                type="button"
                aria-pressed={draft.defenderCount === count}
                onClick={() => updateDraft({ defenderCount: count })}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-black transition ${
                  draft.defenderCount === count
                    ? "border-green-300/45 bg-green-400/15 text-green-100"
                    : "border-white/10 bg-white/[0.045] text-slate-400 hover:text-white"
                }`}
              >
                <Users className="size-4" />
                {count}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3 text-xs leading-5 text-slate-400">
          <p>
            Court preview: shooter ({mappedCourtContext.shooter.x.toFixed(1)},{" "}
            {mappedCourtContext.shooter.y.toFixed(1)}) ft, defender (
            {mappedCourtContext.defender.x.toFixed(1)},{" "}
            {mappedCourtContext.defender.y.toFixed(1)}) ft.
          </p>
          <p className="mt-1">
            Horizontal values map to court X. Distances solve court Y with the
            defender placed toward the basket.
          </p>
        </div>

        <button
          type="button"
          disabled={isSynced}
          onClick={onSendToSandbox}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-orange-300/35 bg-orange-500/15 px-4 text-sm font-black text-orange-100 transition hover:border-orange-300/60 hover:bg-orange-500/25 disabled:cursor-not-allowed disabled:border-green-300/25 disabled:bg-green-400/10 disabled:text-green-100"
        >
          {isSynced ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <Send className="size-4" />
          )}
          {isSynced ? "Synced with Court Sandbox" : "Send to Court Sandbox"}
        </button>
      </div>
    </section>
  );
}

function SyncBadge({ isSynced }: { isSynced: boolean }) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] ${
        isSynced
          ? "border-green-300/30 bg-green-400/10 text-green-100"
          : "border-orange-300/30 bg-orange-500/10 text-orange-100"
      }`}
    >
      {isSynced ? (
        <CheckCircle2 className="size-3.5" />
      ) : (
        <Send className="size-3.5" />
      )}
      {isSynced ? "Synced with Court Sandbox" : "Unsaved court changes"}
    </span>
  );
}

function RangeControl({
  label,
  max,
  min,
  onChange,
  step,
  unit,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  unit?: string;
  value: number;
}) {
  // Range controls update shared store values without local duplicated state.
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        <span>{label}</span>
        <span className="text-slate-200">
          {value.toFixed(1)}
          {unit ? ` ${unit}` : ""}
        </span>
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

function MetricPill({
  icon,
  label,
  tone,
  value,
}: {
  icon: ReactNode;
  label: string;
  tone: "green" | "orange" | "red" | "neutral";
  value: string;
}) {
  // Stage footer metrics summarize the live shared shot state.
  return (
    <div className={`flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2 ${toneClasses[tone]}`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-current/20 bg-black/20">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-70">
          {label}
        </p>
        <p className="truncate text-sm font-black text-white">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  // Compact stat row for the shot information panel.
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span className="truncate text-sm font-black text-white">{value}</span>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  // Icon-only controls stay compact while retaining accessible labels.
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-200 transition hover:border-orange-300/35 hover:text-orange-100"
    >
      {children}
    </button>
  );
}

function getShooterPosePatchFromDrag(
  pose: ShooterPoseState,
  drag: StickmanPoseDrag,
): Partial<ShooterPoseState> {
  const { delta, handle } = drag;

  if (handle === "primaryHand") {
    return {
      handHeight: clampValue(pose.handHeight - delta.y * 0.025, 5, 12),
      releaseAngle: clampValue(pose.releaseAngle - delta.y * 0.16, 20, 92),
      shootingArmAngle: clampValue(
        pose.shootingArmAngle + delta.x * 0.14 - delta.y * 0.12,
        10,
        95,
      ),
    };
  }

  if (handle === "primaryElbow") {
    return {
      shootingArmAngle: clampValue(
        pose.shootingArmAngle + delta.x * 0.12 - delta.y * 0.08,
        10,
        95,
      ),
    };
  }

  if (handle === "secondaryHand" || handle === "secondaryElbow") {
    return {
      guideHandAngle: clampValue(
        pose.guideHandAngle + delta.x * 0.16 - delta.y * 0.08,
        0,
        70,
      ),
    };
  }

  if (handle === "leftKnee") {
    return {
      kneeBend: clampValue(pose.kneeBend + delta.y * 0.2, 0, 60),
      leftLegAngle: clampValue(pose.leftLegAngle + delta.x * 0.18, -45, 45),
    };
  }

  if (handle === "rightKnee") {
    return {
      kneeBend: clampValue(pose.kneeBend + delta.y * 0.2, 0, 60),
      rightLegAngle: clampValue(pose.rightLegAngle + delta.x * 0.18, -45, 45),
    };
  }

  if (handle === "leftFoot") {
    return {
      leftLegAngle: clampValue(pose.leftLegAngle + delta.x * 0.22, -45, 45),
    };
  }

  if (handle === "rightFoot") {
    return {
      rightLegAngle: clampValue(pose.rightLegAngle + delta.x * 0.22, -45, 45),
    };
  }

  if (handle === "head" || handle === "shoulder") {
    return {
      torsoAngle: clampValue(pose.torsoAngle + delta.x * 0.09, -35, 35),
    };
  }

  return {
    kneeBend: clampValue(pose.kneeBend + delta.y * 0.16, 0, 60),
  };
}

function getDefenderPosePatchFromDrag(
  pose: DefenderPoseState,
  drag: StickmanPoseDrag,
): Partial<DefenderPoseState> {
  const { delta, handle } = drag;

  if (handle === "primaryHand" || handle === "primaryElbow") {
    return {
      armRaise: clampValue(pose.armRaise + delta.x * 0.08 - delta.y * 0.22, 0, 100),
      contestHeight: clampValue(pose.contestHeight - delta.y * 0.025, 5, 12),
    };
  }

  if (handle === "secondaryHand" || handle === "secondaryElbow") {
    return {
      leanAngle: clampValue(pose.leanAngle + delta.x * 0.08, -30, 30),
      stanceWidth: clampValue(pose.stanceWidth + Math.abs(delta.x) * 0.01, 0, 5),
    };
  }

  if (handle === "leftKnee" || handle === "rightKnee" || handle === "hip") {
    return {
      kneeBend: clampValue(pose.kneeBend + delta.y * 0.2, 0, 60),
    };
  }

  if (handle === "leftFoot" || handle === "rightFoot") {
    return {
      stanceWidth: clampValue(pose.stanceWidth + delta.x * 0.015, 0, 5),
    };
  }

  return {
    torsoAngle: clampValue(pose.torsoAngle + delta.x * 0.08, -35, 35),
  };
}

function findBlockPoint({
  defenderPose,
  defenderStage,
  releaseAngle,
  releasePoint,
  shotDistance,
  target,
}: {
  defenderPose: DefenderPoseState;
  defenderStage: StagePoint;
  releaseAngle: number;
  releasePoint: StagePoint;
  shotDistance: number;
  target: StagePoint;
}): { point: StagePoint; progress: number } | null {
  const defenderGeometry = getStickmanHitGeometry(
    getStickmanGeometry({
      armRaise: defenderPose.armRaise,
      contestHeight: defenderPose.contestHeight,
      isAirborne: defenderPose.isAirborne,
      jumpHeight: defenderPose.jumpHeight,
      kneeBend: defenderPose.kneeBend,
      leftLegAngle: -defenderPose.stanceWidth * 7 + defenderPose.leanAngle * 0.2,
      rightLegAngle: defenderPose.stanceWidth * 7 + defenderPose.leanAngle * 0.2,
      torsoAngle: defenderPose.torsoAngle + defenderPose.leanAngle,
      type: "defender",
      verticalOffset: defenderPose.verticalOffset,
      x: defenderStage.x,
      y: defenderStage.y,
    }),
  );
  const control = getArcControlPoint({
    releaseAngle,
    releasePoint,
    rim: target,
    shotDistance,
  });

  for (let index = 6; index <= 100; index += 1) {
    const progress = index / 100;
    const point = getBezierPoint(releasePoint, control, target, progress);

    if (doesBallHitDefender(point, defenderGeometry)) {
      return { point, progress };
    }
  }

  return null;
}

function resolveAimedShotOutcome({
  blockPoint,
  fallbackOutcome,
  makeProbability,
  target,
}: {
  blockPoint: StagePoint | null;
  fallbackOutcome: ShotOutcomeKind;
  makeProbability: number;
  target: StagePoint;
}): ShotOutcomeKind {
  if (blockPoint) {
    return "block";
  }

  const rimDistance = distanceBetweenPoints(target, RIM);
  const bankTarget = { x: RIM.x + 36, y: RIM.y - 44 };
  const bankDistance = distanceBetweenPoints(target, bankTarget);
  const isBackboardAim =
    bankDistance <= 45 ||
    (target.x >= RIM.x + 12 &&
      target.x <= RIM.x + 76 &&
      target.y >= RIM.y - 78 &&
      target.y <= RIM.y - 12);

  if (isBackboardAim) {
    return "backboard";
  }

  if (rimDistance <= 18) {
    return fallbackOutcome === "swish" || makeProbability >= 0.62
      ? "swish"
      : "make";
  }

  if (rimDistance <= 38) {
    return makeProbability >= 0.54 ? "make" : "rim-bounce";
  }

  if (rimDistance <= 58) {
    return "rim-bounce";
  }

  return "miss";
}

function doesBallHitDefender(
  ball: StagePoint,
  defenderGeometry: StickmanHitGeometry,
) {
  const ballRadius = 15;
  const touchesCircle = defenderGeometry.circles.some(
    ({ point, radius }) => distanceBetweenPoints(ball, point) <= radius + ballRadius,
  );

  if (touchesCircle) {
    return true;
  }

  return defenderGeometry.segments.some(
    ({ from, radius, to }) =>
      distancePointToSegment(ball, from, to) <= radius + ballRadius,
  );
}

function normalizeSimulatorDraft(
  context: SimulatorShotContext,
): SimulatorShotContext {
  // Horizontal edits can make an old radial distance impossible. Clamp the
  // dependent distances so every draft always maps to a valid court point.
  const shotLimits = getShotDistanceLimits(context.shooterX);
  const shotDistance = clampValue(
    context.shotDistance,
    shotLimits.min,
    shotLimits.max,
  );
  const draftWithValidShot = { ...context, shotDistance };
  const shooter = simulatorContextToCourt(draftWithValidShot).shooter;
  const defenderLimits = getDefenderDistanceLimits(shooter, context.defenderX);

  return {
    ...draftWithValidShot,
    defenderDistance: clampValue(
      context.defenderDistance,
      defenderLimits.min,
      defenderLimits.max,
    ),
  };
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function distanceBetweenPoints(first: StagePoint, second: StagePoint) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function isLegacyRimTarget(point: StagePoint) {
  return LEGACY_RIM_TARGETS.some(
    (legacyTarget) => distanceBetweenPoints(point, legacyTarget) < 18,
  );
}

function distancePointToSegment(
  point: StagePoint,
  segmentStart: StagePoint,
  segmentEnd: StagePoint,
) {
  const segmentLengthSquared =
    (segmentEnd.x - segmentStart.x) ** 2 +
    (segmentEnd.y - segmentStart.y) ** 2;

  if (segmentLengthSquared === 0) {
    return distanceBetweenPoints(point, segmentStart);
  }

  const projection = clampValue(
    ((point.x - segmentStart.x) * (segmentEnd.x - segmentStart.x) +
      (point.y - segmentStart.y) * (segmentEnd.y - segmentStart.y)) /
      segmentLengthSquared,
    0,
    1,
  );
  const closest = {
    x: segmentStart.x + projection * (segmentEnd.x - segmentStart.x),
    y: segmentStart.y + projection * (segmentEnd.y - segmentStart.y),
  };

  return distanceBetweenPoints(point, closest);
}

function clearQueuedTimers(timerBucket: { current: number[] }) {
  // Cancel queued jump phases so repeated button presses never fight each other.
  timerBucket.current.forEach((timerId) => window.clearTimeout(timerId));
  timerBucket.current = [];
}

function queueElevationStep(
  timerBucket: { current: number[] },
  delay: number,
  updatePose: () => void,
) {
  // Store timeout ids so reset/unmount can cancel unfinished jump animations.
  const timerId = window.setTimeout(updatePose, delay);
  timerBucket.current.push(timerId);
}

function mapCourtPointToStage(x: number, y: number): StagePoint {
  // Convert court coordinates into a readable side-view stage position.
  return {
    x: STAGE_COURT_MIN_X + (x / 50) * 560,
    y: FLOOR_Y - Math.min(y / 47, 1) * 58,
  };
}

function mapStagePointToCourt(point: StagePoint) {
  const stageX = clampValue(
    point.x,
    STAGE_COURT_MIN_X,
    STAGE_COURT_MAX_X,
  );
  const stageY = clampValue(
    point.y,
    STAGE_COURT_MIN_Y,
    STAGE_COURT_MAX_Y,
  );

  return {
    x: ((stageX - STAGE_COURT_MIN_X) / 560) * 50,
    y: ((FLOOR_Y - stageY) / 58) * 47,
  };
}

function getPointerStagePoint(event: PointerEvent<SVGGElement>): StagePoint | null {
  const svg = event.currentTarget.ownerSVGElement;
  const screenMatrix = svg?.getScreenCTM();

  if (!svg || !screenMatrix) {
    return null;
  }

  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const transformedPoint = point.matrixTransform(screenMatrix.inverse());

  return {
    x: transformedPoint.x,
    y: transformedPoint.y,
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildSimplePdf(lines: string[]) {
  // A tiny self-contained PDF writer keeps report export dependency-free.
  const safeLines = lines.map((line) =>
    line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"),
  );
  const content = [
    "BT",
    "/F1 12 Tf",
    "50 770 Td",
    ...safeLines.map((line, index) =>
      index === 0 ? `(${line}) Tj` : `0 -24 Td (${line}) Tj`,
    ),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

const qualityBadge: Record<SharedShotQuality, string> = {
  Average: "border-yellow-300/30 bg-yellow-400/10 text-yellow-100",
  Bad: "border-red-300/35 bg-red-500/15 text-red-100",
  Excellent: "border-green-300/35 bg-green-400/15 text-green-100",
  Good: "border-emerald-300/35 bg-emerald-400/15 text-emerald-100",
  Poor: "border-orange-300/35 bg-orange-500/15 text-orange-100",
};

const toneClasses = {
  green: "border-green-300/25 bg-green-400/10 text-green-100",
  neutral: "border-white/10 bg-black/30 text-slate-200",
  orange: "border-orange-300/25 bg-orange-500/10 text-orange-100",
  red: "border-red-300/25 bg-red-500/10 text-red-100",
};
