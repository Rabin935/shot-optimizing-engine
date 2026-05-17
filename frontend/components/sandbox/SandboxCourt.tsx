"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Draggable, {
  type DraggableData,
  type DraggableEvent,
} from "react-draggable";
import { UserRound } from "lucide-react";
import { BasketballCourt } from "@/components/court/BasketballCourt";
import {
  BASKET_LOCATION,
  COURT_LENGTH_FT,
  COURT_WIDTH_FT,
  calculateDistance,
  clamp,
  getShotType,
  getShotZone,
  type CourtPoint,
} from "@/lib/sandbox-metrics";

const SHOOTER_SIZE = 58;
const INITIAL_SHOOTER: CourtPoint = { x: 38, y: 26 };

type ElementSize = {
  width: number;
  height: number;
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

export function SandboxCourt() {
  const courtRef = useRef<HTMLDivElement>(null);
  const shooterRef = useRef<HTMLButtonElement>(null);
  const [courtSize, setCourtSize] = useState<ElementSize>({
    width: 0,
    height: 0,
  });
  const [shooter, setShooter] = useState<CourtPoint>(INITIAL_SHOOTER);

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

  const shooterPixels = useMemo(
    () => pointToPixels(shooter, courtSize, SHOOTER_SIZE),
    [courtSize, shooter],
  );

  const shotDistance = calculateDistance(shooter, BASKET_LOCATION);
  const shotZone = getShotZone(shooter);
  const shotType = getShotType(shooter);

  const handleShooterDrag = useCallback(
    (_event: DraggableEvent, data: DraggableData) => {
      if (!courtSize.width || !courtSize.height) {
        return;
      }

      setShooter(pixelsToPoint(data.x, data.y, courtSize, SHOOTER_SIZE));
    },
    [courtSize],
  );

  return (
    <div>
      <div ref={courtRef}>
        <BasketballCourt>
          {courtSize.width > 0 ? (
            <Draggable
              bounds="parent"
              nodeRef={shooterRef}
              onDrag={handleShooterDrag}
              position={shooterPixels}
            >
              <button
                ref={shooterRef}
                type="button"
                aria-label="Drag shooter"
                className="absolute grid place-items-center rounded-full border-4 border-orange-100 bg-orange-500 text-black shadow-[0_0_26px_rgba(255,106,0,0.72)] outline-none transition hover:scale-105 hover:bg-orange-400 focus-visible:ring-2 focus-visible:ring-orange-100"
                style={{ width: SHOOTER_SIZE, height: SHOOTER_SIZE }}
              >
                <UserRound className="size-7" />
              </button>
            </Draggable>
          ) : null}
        </BasketballCourt>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <MetricPill label="X Coordinate" value={`${shooter.x.toFixed(1)} ft`} />
        <MetricPill label="Y Coordinate" value={`${shooter.y.toFixed(1)} ft`} />
        <MetricPill label="Distance" value={`${shotDistance.toFixed(1)} ft`} />
        <MetricPill label="Shot Zone" value={`${shotZone} (${shotType})`} />
      </div>
    </div>
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
