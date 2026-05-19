"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BasketballCourt } from "@/components/court/BasketballCourt";
import { DefenderDot } from "@/components/sandbox/DefenderDot";
import { PlayerDot } from "@/components/sandbox/PlayerDot";
import { PressureRadius } from "@/components/sandbox/PressureRadius";
import { ShotLine } from "@/components/sandbox/ShotLine";
import {
  BASKET_LOCATION,
  SNAP_TARGETS,
  calculateSandboxStats,
  getNearestSnapTarget,
  pointToPixels,
  type CourtPoint,
  type CourtSize,
  type DefenderDistance,
  type SandboxDefender,
  type SandboxStats,
  type ShotQuality,
} from "@/lib/sandbox-metrics";

const SHOOTER_SIZE = 58;
const DEFENDER_SIZE = 46;

type SandboxCourtProps = {
  defenders: SandboxDefender[];
  onDefenderMove: (id: string, point: CourtPoint) => void;
  onShooterMove: (point: CourtPoint) => void;
  shooter: CourtPoint;
  showAnalyticsOverlay: boolean;
  showCourtLabels: boolean;
  showDefenderRadius: boolean;
  showShotLine: boolean;
  stats?: SandboxStats;
};

export function SandboxCourt({
  defenders,
  onDefenderMove,
  onShooterMove,
  shooter,
  showAnalyticsOverlay,
  showCourtLabels,
  showDefenderRadius,
  showShotLine,
  stats: providedStats,
}: SandboxCourtProps) {
  const courtRef = useRef<HTMLDivElement>(null);
  const [courtSize, setCourtSize] = useState<CourtSize>({
    height: 0,
    width: 0,
  });

  useEffect(() => {
    const court = courtRef.current;

    if (!court) {
      return;
    }

    const updateSize = () => {
      const rect = court.getBoundingClientRect();
      setCourtSize({ height: rect.height, width: rect.width });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(court);

    return () => observer.disconnect();
  }, []);

  const stats = providedStats ?? calculateSandboxStats(shooter, defenders);
  const activeSnap = useMemo(() => {
    const nearest = getNearestSnapTarget(shooter);

    if (nearest.target && nearest.distance <= 0.2) {
      return nearest.target;
    }

    return null;
  }, [shooter]);

  const handleDefenderDrag = useCallback(
    (id: string, point: CourtPoint) => {
      onDefenderMove(id, point);
    },
    [onDefenderMove],
  );

  return (
    <div>
      <div ref={courtRef}>
        <BasketballCourt
          feedbackTone={courtFeedbackTone[stats.shotQuality]}
          showLabels={showCourtLabels}
          showLines
        >
          {courtSize.width > 0 && courtSize.height > 0 ? (
            <>
              <CourtAnalyticsOverlay
                courtSize={courtSize}
                defenders={stats.defenderDistances}
                shooter={shooter}
                visible={showAnalyticsOverlay}
              />
              <PressureRadius
                closestDefenderId={stats.closestDefenderId}
                courtSize={courtSize}
                defenders={defenders}
                visible={showDefenderRadius}
              />
              <ShotLine
                courtSize={courtSize}
                quality={stats.shotQuality}
                shooter={shooter}
                visible={showShotLine}
              />

              <PlayerDot
                ariaLabel="Drag shooter"
                courtSize={courtSize}
                markerSize={SHOOTER_SIZE}
                onMove={onShooterMove}
                point={shooter}
                quality={stats.shotQuality}
                snapToZones
                tone="shooter"
              />

              {defenders.map((defender) => (
                <DefenderDot
                  key={defender.id}
                  courtSize={courtSize}
                  defender={defender}
                  isClosest={defender.id === stats.closestDefenderId}
                  markerSize={DEFENDER_SIZE}
                  onMove={(point) => handleDefenderDrag(defender.id, point)}
                />
              ))}
            </>
          ) : null}
        </BasketballCourt>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <MetricPill
          label="Snap Assist"
          tone={activeSnap ? "green" : "neutral"}
          value={activeSnap?.label ?? "Free Move"}
        />
        <MetricPill
          label="Shooter Coordinates"
          tone="neutral"
          value={`${shooter.x.toFixed(1)}, ${shooter.y.toFixed(1)} ft`}
        />
        <MetricPill
          label="Closest Defender"
          tone={stats.closestDefenderDistance <= 4 ? "red" : "neutral"}
          value={formatDistance(stats.closestDefenderDistance)}
        />
        <MetricPill
          label="Live EPPS"
          tone={stats.expectedPoints >= 1.05 ? "green" : stats.expectedPoints >= 0.85 ? "orange" : "red"}
          value={stats.expectedPoints.toFixed(2)}
        />
      </div>
    </div>
  );
}

function CourtAnalyticsOverlay({
  courtSize,
  defenders,
  shooter,
  visible,
}: {
  courtSize: CourtSize;
  defenders: DefenderDistance[];
  shooter: CourtPoint;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }

  const shooterPixels = pointToPixels(shooter, courtSize);
  const basketPixels = pointToPixels(BASKET_LOCATION, courtSize);
  const closestDefender = defenders.reduce<DefenderDistance | null>(
    (closest, defender) => {
      if (!closest || defender.distance < closest.distance) {
        return defender;
      }

      return closest;
    },
    null,
  );

  return (
    <svg className="pointer-events-none absolute inset-0 z-[7] h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="sandbox-zone-fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      <motion.rect
        x={courtSize.width * 0.34}
        y={courtSize.height * 0.04}
        width={courtSize.width * 0.32}
        height={courtSize.height * 0.4}
        rx="10"
        fill="rgba(15,23,42,0.08)"
        stroke="rgba(255,255,255,0.12)"
        initial={false}
        animate={{ opacity: 0.8 }}
      />

      <motion.line
        x1={shooterPixels.x}
        y1={shooterPixels.y}
        x2={basketPixels.x}
        y2={basketPixels.y}
        stroke="rgba(255,255,255,0.28)"
        strokeDasharray="4 8"
        strokeLinecap="round"
        strokeWidth="1.5"
        initial={false}
        animate={{
          x1: shooterPixels.x,
          x2: basketPixels.x,
          y1: shooterPixels.y,
          y2: basketPixels.y,
        }}
        transition={{ type: "spring", stiffness: 190, damping: 28 }}
      />

      {defenders.map((defender) => {
        const defenderPixels = pointToPixels(defender.point, courtSize);
        const isClosest = defender.id === closestDefender?.id;

        return (
          <motion.line
            key={defender.id}
            x1={shooterPixels.x}
            y1={shooterPixels.y}
            x2={defenderPixels.x}
            y2={defenderPixels.y}
            stroke={isClosest ? "rgba(248,113,113,0.58)" : "rgba(125,211,252,0.34)"}
            strokeDasharray={isClosest ? "0" : "5 8"}
            strokeLinecap="round"
            strokeWidth={isClosest ? "2.5" : "1.5"}
            initial={false}
            animate={{
              x1: shooterPixels.x,
              x2: defenderPixels.x,
              y1: shooterPixels.y,
              y2: defenderPixels.y,
            }}
            transition={{ type: "spring", stiffness: 190, damping: 28 }}
          />
        );
      })}

      {SNAP_TARGETS.map((target) => {
        const pixels = pointToPixels(target.point, courtSize);

        return (
          <g key={target.id}>
            <circle
              cx={pixels.x}
              cy={pixels.y}
              r="6"
              fill="rgba(16,185,129,0.16)"
              stroke="rgba(187,247,208,0.68)"
              strokeWidth="1.5"
            />
            <path
              d={`M ${pixels.x - 10} ${pixels.y}H${pixels.x + 10}M${pixels.x} ${pixels.y - 10}V${pixels.y + 10}`}
              stroke="rgba(187,247,208,0.6)"
              strokeLinecap="round"
              strokeWidth="1.2"
            />
            <text
              x={pixels.x + 10}
              y={pixels.y - 10}
              fill="rgba(255,255,255,0.72)"
              fontFamily="Arial, Helvetica, sans-serif"
              fontSize="11"
              fontWeight="800"
              letterSpacing="0"
            >
              {target.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function MetricPill({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "green" | "orange" | "red" | "neutral";
  value: string;
}) {
  return (
    <div className={`rounded-lg border px-4 py-3 shadow-[0_14px_38px_rgba(0,0,0,0.2)] ${pillTone[tone]}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">
        {label}
      </p>
      <p className="mt-1 truncate font-black text-white">{value}</p>
    </div>
  );
}

function formatDistance(distance: number) {
  if (!Number.isFinite(distance)) {
    return "No defender";
  }

  return `${distance.toFixed(1)} ft`;
}

const courtFeedbackTone: Record<ShotQuality, "green" | "orange" | "red" | "sky"> = {
  Average: "orange",
  Bad: "red",
  Excellent: "green",
  Good: "green",
  Poor: "orange",
};

const pillTone = {
  green: "border-green-300/25 bg-green-400/10 text-green-100",
  neutral: "border-white/10 bg-black/35 text-slate-200",
  orange: "border-orange-300/25 bg-orange-500/10 text-orange-100",
  red: "border-red-300/25 bg-red-500/10 text-red-100",
};
