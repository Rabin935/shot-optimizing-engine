"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import Draggable, {
  type DraggableData,
  type DraggableEvent,
} from "react-draggable";
import { motion } from "framer-motion";
import { Shield, UserRound } from "lucide-react";
import { BasketballCourt } from "@/components/court/BasketballCourt";
import {
  BASKET_LOCATION,
  COURT_LENGTH_FT,
  COURT_WIDTH_FT,
  calculateSandboxStats,
  clamp,
  type CourtPoint,
  type DefenderPressure,
  type DefenderDistance,
  type SandboxDefender,
  type SandboxStats,
} from "@/lib/sandbox-metrics";

const SHOOTER_SIZE = 58;
const DEFENDER_SIZE = 46;

type ElementSize = {
  width: number;
  height: number;
};

type SandboxCourtProps = {
  defenders: SandboxDefender[];
  onDefenderMove: (id: string, point: CourtPoint) => void;
  onShooterMove: (point: CourtPoint) => void;
  showLines?: boolean;
  shooter: CourtPoint;
  stats?: SandboxStats;
};

function pointToPixels(
  point: CourtPoint,
  size: ElementSize,
  markerSize: number,
) {
  return {
    x: (point.x / COURT_WIDTH_FT) * size.width - markerSize / 2,
    y: (point.y / COURT_LENGTH_FT) * size.height - markerSize / 2,
  };
}

function pointToCenterPixels(point: CourtPoint, size: ElementSize) {
  return {
    x: (point.x / COURT_WIDTH_FT) * size.width,
    y: (point.y / COURT_LENGTH_FT) * size.height,
  };
}

function pixelsToPoint(
  x: number,
  y: number,
  size: ElementSize,
  markerSize: number,
): CourtPoint {
  return {
    x: clamp(((x + markerSize / 2) / size.width) * COURT_WIDTH_FT, 0, COURT_WIDTH_FT),
    y: clamp(((y + markerSize / 2) / size.height) * COURT_LENGTH_FT, 0, COURT_LENGTH_FT),
  };
}

export function SandboxCourt({
  defenders,
  onDefenderMove,
  onShooterMove,
  showLines = true,
  shooter,
  stats: providedStats,
}: SandboxCourtProps) {
  const courtRef = useRef<HTMLDivElement>(null);
  const shooterRef = useRef<HTMLButtonElement>(null);
  const [courtSize, setCourtSize] = useState<ElementSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const court = courtRef.current;

    if (!court) {
      return;
    }

    const updateSize = () => {
      const rect = court.getBoundingClientRect();
      setCourtSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(court);

    return () => observer.disconnect();
  }, []);

  const stats =
    providedStats ?? calculateSandboxStats(shooter, defenders);

  const handleDefenderDrag = useCallback(
    (id: string, point: CourtPoint) => {
      onDefenderMove(id, point);
    },
    [onDefenderMove],
  );

  return (
    <div>
      <div ref={courtRef}>
        <BasketballCourt showLines={showLines}>
          {courtSize.width > 0 ? (
            <>
              <CourtTelemetryOverlay
                courtSize={courtSize}
                defenders={stats.defenderDistances}
                shooter={shooter}
              />

              <CourtMarker
                ariaLabel="Drag shooter"
                courtSize={courtSize}
                icon={<UserRound className="size-7" />}
                markerRef={shooterRef}
                markerSize={SHOOTER_SIZE}
                onMove={onShooterMove}
                point={shooter}
                tone="shooter"
              />

              {defenders.map((defender) => (
                <CourtMarker
                  key={defender.id}
                  ariaLabel={`Drag defender ${defender.label}`}
                  courtSize={courtSize}
                  icon={<Shield className="size-5" />}
                  label={defender.label}
                  markerSize={DEFENDER_SIZE}
                  onMove={(point) => handleDefenderDrag(defender.id, point)}
                  point={defender.point}
                  tone={defender.tone}
                />
              ))}
            </>
          ) : null}
        </BasketballCourt>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <MetricPill label="X Coordinate" value={`${shooter.x.toFixed(1)} ft`} />
        <MetricPill label="Y Coordinate" value={`${shooter.y.toFixed(1)} ft`} />
        <MetricPill
          label="Distance"
          value={`${stats.distanceToBasket.toFixed(1)} ft`}
        />
        <MetricPill
          label="Shot Zone"
          value={`${stats.shotZone} (${stats.shotType})`}
        />
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        {stats.defenderDistances.map((defender) => (
          <MetricPill
            key={defender.id}
            label={`${defender.label} Distance`}
            value={`${defender.distance.toFixed(1)} ft`}
          />
        ))}
        <div
          className={`rounded-lg border px-4 py-3 ${pressureStyles[stats.defenderPressure]}`}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-75">
            Defender Pressure
          </p>
          <p className="mt-1 font-black">
            {stats.defenderPressure} /{" "}
            {stats.closestDefenderDistance.toFixed(1)} ft
          </p>
        </div>
      </div>
    </div>
  );
}

function CourtTelemetryOverlay({
  courtSize,
  defenders,
  shooter,
}: {
  courtSize: ElementSize;
  defenders: DefenderDistance[];
  shooter: CourtPoint;
}) {
  const shooterPixels = pointToCenterPixels(shooter, courtSize);
  const basketPixels = pointToCenterPixels(BASKET_LOCATION, courtSize);
  const scale = Math.min(
    courtSize.width / COURT_WIDTH_FT,
    courtSize.height / COURT_LENGTH_FT,
  );
  const pressureRadius = 6 * scale;
  const arcControl = {
    x: (shooterPixels.x + basketPixels.x) / 2,
    y: Math.min(shooterPixels.y, basketPixels.y) - 78,
  };
  const shotPath = `M ${shooterPixels.x} ${shooterPixels.y} Q ${arcControl.x} ${arcControl.y} ${basketPixels.x} ${basketPixels.y}`;
  const closestDefender = defenders.reduce((closest, defender) =>
    defender.distance < closest.distance ? defender : closest,
  );

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <filter
          id="sandbox-telemetry-glow"
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.circle
        cx={shooterPixels.x}
        cy={shooterPixels.y}
        r={pressureRadius}
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.18)"
        strokeDasharray="7 9"
        initial={false}
        animate={{ cx: shooterPixels.x, cy: shooterPixels.y }}
        transition={{ type: "spring", stiffness: 180, damping: 28 }}
      />
      <motion.path
        d={shotPath}
        fill="none"
        stroke="#FF6A00"
        strokeDasharray="10 10"
        strokeLinecap="round"
        strokeWidth="3"
        filter="url(#sandbox-telemetry-glow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.88 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />
      {defenders.map((defender) => {
        const defenderPixels = pointToCenterPixels(defender.point, courtSize);

        return (
          <motion.line
            key={defender.id}
            x1={shooterPixels.x}
            y1={shooterPixels.y}
            x2={defenderPixels.x}
            y2={defenderPixels.y}
            stroke={
              defender.id === closestDefender.id
                ? "rgba(248,113,113,0.5)"
                : "rgba(56,189,248,0.32)"
            }
            strokeDasharray={defender.id === closestDefender.id ? "0" : "5 8"}
            strokeLinecap="round"
            strokeWidth={defender.id === closestDefender.id ? "2.5" : "1.5"}
            initial={false}
            animate={{
              x1: shooterPixels.x,
              x2: defenderPixels.x,
              y1: shooterPixels.y,
              y2: defenderPixels.y,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        );
      })}
    </svg>
  );
}

function CourtMarker({
  ariaLabel,
  courtSize,
  icon,
  label,
  markerRef,
  markerSize,
  onMove,
  point,
  tone,
}: {
  ariaLabel: string;
  courtSize: ElementSize;
  icon: ReactNode;
  label?: string;
  markerRef?: RefObject<HTMLButtonElement | null>;
  markerSize: number;
  onMove: (point: CourtPoint) => void;
  point: CourtPoint;
  tone: "shooter" | "red" | "blue";
}) {
  const localRef = useRef<HTMLButtonElement>(null);
  const nodeRef = markerRef ?? localRef;
  const markerPixels = useMemo(
    () => pointToPixels(point, courtSize, markerSize),
    [courtSize, markerSize, point],
  );

  const handleDrag = useCallback(
    (_event: DraggableEvent, data: DraggableData) => {
      if (!courtSize.width || !courtSize.height) {
        return;
      }

      onMove(pixelsToPoint(data.x, data.y, courtSize, markerSize));
    },
    [courtSize, markerSize, onMove],
  );

  return (
    <Draggable
      bounds="parent"
      nodeRef={nodeRef}
      onDrag={handleDrag}
      position={markerPixels}
    >
      <button
        ref={nodeRef}
        type="button"
        aria-label={ariaLabel}
        className={`absolute grid cursor-grab place-items-center rounded-full outline-none transition active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-white [touch-action:none] ${markerStyles[tone]}`}
        style={{ width: markerSize, height: markerSize }}
      >
        <motion.span
          className="grid size-full place-items-center rounded-full"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
        >
          {icon}
        </motion.span>
        {label ? (
          <span className="absolute -bottom-6 rounded-full border border-white/10 bg-black/70 px-2 py-0.5 text-[10px] font-black text-white">
            {label}
          </span>
        ) : null}
      </button>
    </Draggable>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/35 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}

const markerStyles = {
  shooter:
    "border-4 border-orange-100 bg-orange-500 text-black shadow-[0_0_26px_rgba(255,106,0,0.72)] hover:bg-orange-400",
  red: "border-[3px] border-red-100 bg-red-500 text-white shadow-[0_0_22px_rgba(239,68,68,0.62)] hover:bg-red-400",
  blue: "border-[3px] border-sky-100 bg-sky-500 text-white shadow-[0_0_22px_rgba(14,165,233,0.58)] hover:bg-sky-400",
};

const pressureStyles: Record<DefenderPressure, string> = {
  "Very Tight": "border-red-300/35 bg-red-500/15 text-red-100",
  Tight: "border-orange-300/35 bg-orange-500/15 text-orange-100",
  Open: "border-yellow-300/35 bg-yellow-400/15 text-yellow-100",
  "Very Open": "border-green-300/35 bg-green-400/15 text-green-100",
};
