"use client";

import { motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";
import { useMotionSettings } from "@/hooks/useMotionSettings";
import type { ShotRecommendation } from "@/lib/sandbox-metrics";

type RecommendationCardProps = {
  recommendation: ShotRecommendation;
};

export function RecommendationCard({
  recommendation,
}: RecommendationCardProps) {
  const { duration, reduceMotion } = useMotionSettings();

  return (
    <motion.div
      layout={!reduceMotion}
      className={`rounded-lg border p-4 shadow-[var(--shadow-panel)] ${recommendationTone[recommendation.tone]}`}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-current/20 bg-black/20">
          <BrainCircuit className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-75">
            Recommendation
          </p>
          <motion.p
            key={recommendation.title}
            initial={reduceMotion ? false : { opacity: 0.72, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration(0.18) }}
            className="mt-1 text-base font-black text-foreground"
          >
            {recommendation.title}
          </motion.p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {recommendation.message}
      </p>
    </motion.div>
  );
}

const recommendationTone: Record<ShotRecommendation["tone"], string> = {
  green: "border-green-300/25 bg-green-400/10 text-success",
  orange: "border-orange-300/25 bg-orange-500/10 text-primary-strong",
  red: "border-red-300/25 bg-red-500/10 text-danger",
  sky: "border-sky-300/25 bg-sky-500/10 text-secondary",
};
