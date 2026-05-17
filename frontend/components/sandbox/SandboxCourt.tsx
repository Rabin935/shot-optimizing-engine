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
import { Shield, UserRound } from "lucide-react";
import { BasketballCourt } from "@/components/court/BasketballCourt";
import {
  COURT_LENGTH_FT,
  COURT_WIDTH_FT,
  calculateSandboxStats,
  clamp,
  type CourtPoint,
  type DefenderPressure,
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
        <BasketballCourt>
          {courtSize.width > 0 ? (
            <>
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
            {stats.defenderPressure} ·{" "}
            {stats.closestDefenderDistance.toFixed(1)} ft
          </p>
        </div>
      </div>
    </div>
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
        className={`absolute grid place-items-center rounded-full outline-none transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-white ${markerStyles[tone]}`}
        style={{ width: markerSize, height: markerSize }}
      >
        {icon}
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
