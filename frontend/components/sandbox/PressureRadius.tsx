"use client";

import { motion } from "framer-motion";
import {
  getFeetToPixelsScale,
  pointToPixels,
  type CourtSize,
  type SandboxDefender,
} from "@/lib/sandbox-metrics";

type PressureRadiusProps = {
  closestDefenderId: string | null;
  courtSize: CourtSize;
  defenders: SandboxDefender[];
  visible: boolean;
};

export function PressureRadius({
  closestDefenderId,
  courtSize,
  defenders,
  visible,
}: PressureRadiusProps) {
  if (!visible) {
    // Hide the overlay entirely when the user disables defender radius display.
    return null;
  }

  // Convert pressure distances in feet into SVG radii in pixels.
  const scale = getFeetToPixelsScale(courtSize).average;
  const closeoutRadius = 6 * scale;
  const smotherRadius = 2.25 * scale;

  return (
    <svg className="pointer-events-none absolute inset-0 z-[8] h-full w-full" aria-hidden="true">
      {defenders.map((defender) => {
        // Draw a larger closeout ring and a smaller smothering ring per defender.
        const pixels = pointToPixels(defender.point, courtSize);
        const isClosest = defender.id === closestDefenderId;

        return (
          <g key={defender.id}>
            <motion.circle
              cx={pixels.x}
              cy={pixels.y}
              r={closeoutRadius}
              fill={isClosest ? "rgba(248,113,113,0.12)" : "rgba(56,189,248,0.08)"}
              stroke={isClosest ? "rgba(248,113,113,0.7)" : "rgba(56,189,248,0.42)"}
              strokeDasharray="8 8"
              strokeWidth={isClosest ? 2.4 : 1.6}
              initial={false}
              animate={{ cx: pixels.x, cy: pixels.y, r: closeoutRadius }}
              transition={{ type: "spring", stiffness: 180, damping: 28 }}
            />
            <motion.circle
              cx={pixels.x}
              cy={pixels.y}
              r={smotherRadius}
              fill="none"
              stroke={isClosest ? "rgba(254,226,226,0.78)" : "rgba(186,230,253,0.48)"}
              strokeWidth={isClosest ? 2 : 1.4}
              initial={false}
              animate={{ cx: pixels.x, cy: pixels.y, r: smotherRadius }}
              transition={{ type: "spring", stiffness: 180, damping: 28 }}
            />
          </g>
        );
      })}
    </svg>
  );
}
