"use client";

import { AlertTriangle, CheckCircle2, Shield, Target } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  useShotStore,
  type DefenderPoseState,
  type ShooterPoseState,
} from "@/store/useShotStore";

type ReleaseQuality = "Balanced" | "Rushed" | "Low release" | "Off-balance";
type ContestQuality = "Late" | "Moderate" | "Strong contest";

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

export function PoseAnalytics() {
  const activeDefenderCount = useShotStore((state) => state.activeDefenderCount);
  const defenders = useShotStore((state) => state.defenders);
  const defenderPoses = useShotStore((state) => state.defenderPoses);
  const shooterPose = useShotStore((state) => state.shooterPose);
  const activeDefenders = defenders.slice(0, activeDefenderCount);
  const primaryDefenderId = activeDefenders[0]?.id ?? "d1";
  const defenderPose =
    defenderPoses[primaryDefenderId] ?? FALLBACK_DEFENDER_POSE;
  const releaseInsight = useMemo(
    () => evaluateReleaseQuality(shooterPose),
    [shooterPose],
  );
  const contestInsight = useMemo(
    () => evaluateContestQuality(defenderPose),
    [defenderPose],
  );

  return (
    <section className="grid gap-3">
      <InsightCard
        description={releaseInsight.feedback}
        icon={<Target className="size-4" />}
        label="Pose Quality Card"
        scoreLabel={releaseInsight.indicator}
        title={`Release quality: ${releaseInsight.quality}`}
        tone={releaseInsight.tone}
      />
      <InsightCard
        description={contestInsight.feedback}
        icon={<Shield className="size-4" />}
        label="Contest Impact Card"
        scoreLabel={contestInsight.indicator}
        title={`Contest quality: ${contestInsight.quality}`}
        tone={contestInsight.tone}
      />
      <div className="rounded-lg border border-white/10 bg-black/30 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Coaching Feedback
        </p>
        <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-200">
          <FeedbackLine good={releaseInsight.tone === "green"}>
            {releaseInsight.feedback}
          </FeedbackLine>
          <FeedbackLine good={contestInsight.tone === "green"}>
            {contestInsight.feedback}
          </FeedbackLine>
        </div>
      </div>
    </section>
  );
}

function InsightCard({
  description,
  icon,
  label,
  scoreLabel,
  title,
  tone,
}: {
  description: string;
  icon: ReactNode;
  label: string;
  scoreLabel: string;
  title: string;
  tone: "green" | "orange" | "red";
}) {
  return (
    <article className={`rounded-lg border p-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
            {label}
          </p>
          <h3 className="mt-1 text-base font-black text-white">{title}</h3>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-current/25 bg-black/20">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-200">{description}</p>
      <p className="mt-3 rounded-md border border-white/10 bg-black/25 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
        {scoreLabel}
      </p>
    </article>
  );
}

function FeedbackLine({
  children,
  good,
}: {
  children: ReactNode;
  good: boolean;
}) {
  return (
    <p className="flex gap-2">
      {good ? (
        <CheckCircle2 className="mt-1 size-4 shrink-0 text-green-300" />
      ) : (
        <AlertTriangle className="mt-1 size-4 shrink-0 text-orange-300" />
      )}
      <span>{children}</span>
    </p>
  );
}

function evaluateReleaseQuality(shooterPose: ShooterPoseState) {
  // Release score is intentionally light-touch: it produces coaching context
  // beside the ML output instead of changing the model probability.
  const kneeScore = scoreRange(shooterPose.kneeBend, 14, 34, 16);
  const torsoScore = scoreRange(Math.abs(shooterPose.torsoAngle), 0, 9, 12);
  const releaseAngleScore = scoreRange(shooterPose.releaseAngle, 45, 55, 12);
  const handHeightScore = scoreRange(shooterPose.handHeight, 8.2, 10.5, 1.2);
  const score =
    kneeScore * 0.26 +
    torsoScore * 0.26 +
    releaseAngleScore * 0.3 +
    handHeightScore * 0.18;

  if (shooterPose.handHeight < 7.8 || shooterPose.releaseAngle < 42) {
    return {
      feedback: "Shooter release is slightly low.",
      indicator: "Small negative pose indicator",
      quality: "Low release" as ReleaseQuality,
      tone: "orange" as const,
    };
  }

  if (Math.abs(shooterPose.torsoAngle) > 13) {
    return {
      feedback: "Shooter is off-balance through the release window.",
      indicator: "Warning: posture leak",
      quality: "Off-balance" as ReleaseQuality,
      tone: "red" as const,
    };
  }

  if (shooterPose.kneeBend < 12 || shooterPose.shootingArmAngle > 78) {
    return {
      feedback: "Shooter release looks rushed with limited set rhythm.",
      indicator: "Small negative pose indicator",
      quality: "Rushed" as ReleaseQuality,
      tone: "orange" as const,
    };
  }

  return {
    feedback:
      score >= 0.72
        ? "Shooter has good knee bend, balanced torso, and a usable release angle."
        : "Shooter mechanics are playable, but release timing could be cleaner.",
    indicator: score >= 0.72 ? "Small positive pose indicator" : "Neutral pose indicator",
    quality: "Balanced" as ReleaseQuality,
    tone: score >= 0.72 ? ("green" as const) : ("orange" as const),
  };
}

function evaluateContestQuality(defenderPose: DefenderPoseState) {
  // Contest strength combines arm raise, contest height, and airborne timing
  // as a separate frontend insight for later ML feature design.
  const armScore = defenderPose.armRaise / 100;
  const heightScore = scoreRange(defenderPose.contestHeight, 7.8, 11.5, 2);
  const jumpBoost = defenderPose.isAirborne ? 0.18 : 0;
  const contestStrength = armScore * 0.48 + heightScore * 0.34 + jumpBoost;

  if (contestStrength >= 0.78) {
    return {
      feedback:
        "Defender contest is strong due to high arm raise and jump timing.",
      indicator: "Contest pressure: high",
      quality: "Strong contest" as ContestQuality,
      tone: "red" as const,
    };
  }

  if (contestStrength >= 0.48) {
    return {
      feedback:
        "Defender contest is moderate; release window is affected but not fully erased.",
      indicator: "Contest pressure: medium",
      quality: "Moderate" as ContestQuality,
      tone: "orange" as const,
    };
  }

  return {
    feedback: "Defender contest is late with limited arm pressure at release.",
    indicator: "Contest pressure: low",
    quality: "Late" as ContestQuality,
    tone: "green" as const,
  };
}

function scoreRange(value: number, idealMin: number, idealMax: number, falloff: number) {
  if (value >= idealMin && value <= idealMax) {
    return 1;
  }

  const distanceFromRange =
    value < idealMin ? idealMin - value : value - idealMax;

  return Math.max(0, 1 - distanceFromRange / falloff);
}

const toneClasses = {
  green: "border-green-300/25 bg-green-400/10 text-green-100",
  orange: "border-orange-300/25 bg-orange-500/10 text-orange-100",
  red: "border-red-300/25 bg-red-500/10 text-red-100",
};
