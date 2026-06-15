"use client";

import { motion } from "framer-motion";
import {
  BASKET_LOCATION,
  pointToPixels,
  type CourtPoint,
  type CourtSize,
  type ShotQuality,
} from "@/lib/sandbox-metrics";

type ShotLineProps = {
  courtSize: CourtSize;
  quality: ShotQuality;
  shooter: CourtPoint;
  visible: boolean;
};

export function ShotLine({
  courtSize,
  quality,
  shooter,
  visible,
}: ShotLineProps) {
  if (!visible) {
    // Hide the trajectory overlay when the user turns off shot line display.
    return null;
  }

  // Convert the shooter and basket to pixels so the SVG curve tracks dragging.
  const shooterPixels = pointToPixels(shooter, courtSize);
  const basketPixels = pointToPixels(BASKET_LOCATION, courtSize);
  const control = {
    // Lift the control point above the shooter and basket to form a shot arc.
    x: (shooterPixels.x + basketPixels.x) / 2,
    y: Math.min(shooterPixels.y, basketPixels.y) - 82,
  };
  // Quadratic curve from shooter to rim using the lifted control point.
  const shotPath = `M ${shooterPixels.x} ${shooterPixels.y} Q ${control.x} ${control.y} ${basketPixels.x} ${basketPixels.y}`;
  const stroke = shotTone[quality];

  return (
    <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden="true">
      <defs>
        <filter id="sandbox-shot-line-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.path
        d={shotPath}
        fill="none"
        stroke={stroke}
        strokeDasharray="10 10"
        strokeLinecap="round"
        strokeWidth="3"
        filter="url(#sandbox-shot-line-glow)"
        initial={false}
        animate={{ d: shotPath, opacity: 0.92, pathLength: 1 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
      />
      <motion.circle
        cx={basketPixels.x}
        cy={basketPixels.y}
        r="5"
        fill={stroke}
        initial={false}
        animate={{ opacity: [0.45, 0.95, 0.45], scale: [0.9, 1.18, 0.9] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

const shotTone: Record<ShotQuality, string> = {
  Average: "#FACC15",
  Bad: "#F87171",
  Excellent: "#4ADE80",
  Good: "#34D399",
  Poor: "#FB923C",
};
