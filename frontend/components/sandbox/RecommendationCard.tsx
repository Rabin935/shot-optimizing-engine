"use client";

import { motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";
import type { ShotRecommendation } from "@/lib/sandbox-metrics";

type RecommendationCardProps = {
  recommendation: ShotRecommendation;
};

export function RecommendationCard({
  recommendation,
}: RecommendationCardProps) {
  // Render the current recommendation with tone-specific visual emphasis.
  return (
    <motion.div
      layout
      className={`rounded-lg border p-4 shadow-[0_18px_45px_rgba(0,0,0,0.22)] ${recommendationTone[recommendation.tone]}`}
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
            initial={{ opacity: 0.72, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-1 text-base font-black text-white"
          >
            {recommendation.title}
          </motion.p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-200">
        {recommendation.message}
      </p>
    </motion.div>
  );
}

const recommendationTone: Record<ShotRecommendation["tone"], string> = {
  green: "border-green-300/25 bg-green-400/10 text-green-100",
  orange: "border-orange-300/25 bg-orange-500/10 text-orange-100",
  red: "border-red-300/25 bg-red-500/10 text-red-100",
  sky: "border-sky-300/25 bg-sky-500/10 text-sky-100",
};
