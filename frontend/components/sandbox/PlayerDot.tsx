"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Draggable, {
  type DraggableData,
  type DraggableEvent,
} from "react-draggable";
import { motion } from "framer-motion";
import { UserRound } from "lucide-react";
import {
  applySnapAssist,
  type CourtPoint,
  getMarkerBounds,
  markerPositionToPoint,
  pointToMarkerPosition,
  type CourtSize,
  type ShotQuality,
} from "@/lib/sandbox-metrics";

export type PlayerDotTone = "shooter" | "red" | "blue";

type PlayerDotProps = {
  ariaLabel: string;
  courtSize: CourtSize;
  icon?: ReactNode;
  isClosest?: boolean;
  label?: string;
  markerSize: number;
  onMove: (point: CourtPoint) => void;
  point: CourtPoint;
  quality?: ShotQuality;
  snapToZones?: boolean;
  tone: PlayerDotTone;
};

export function PlayerDot({
  ariaLabel,
  courtSize,
  icon = <UserRound className="size-7" />,
  isClosest = false,
  label,
  markerSize,
  onMove,
  point,
  quality,
  snapToZones = false,
  tone,
}: PlayerDotProps) {
  const nodeRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const markerPixels = useMemo(
    () => pointToMarkerPosition(point, courtSize, markerSize),
    [courtSize, markerSize, point],
  );

  const handleDrag = useCallback(
    (_event: DraggableEvent, data: DraggableData) => {
      if (!courtSize.width || !courtSize.height) {
        return;
      }

      const nextPoint = markerPositionToPoint(
        { x: data.x, y: data.y },
        courtSize,
        markerSize,
      );

      onMove(snapToZones ? applySnapAssist(nextPoint) : nextPoint);
    },
    [courtSize, markerSize, onMove, snapToZones],
  );

  return (
    <Draggable
      bounds={getMarkerBounds(courtSize, markerSize)}
      nodeRef={nodeRef}
      onDrag={handleDrag}
      onStart={() => setIsDragging(true)}
      onStop={() => setIsDragging(false)}
      position={markerPixels}
    >
      <button
        ref={nodeRef}
        type="button"
        aria-label={ariaLabel}
        className={`group absolute z-20 grid cursor-grab place-items-center rounded-full outline-none transition active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-white [touch-action:none] ${dotToneStyles[tone]}`}
        style={{ width: markerSize, height: markerSize }}
      >
        {quality ? (
          <motion.span
            className={`pointer-events-none absolute -inset-3 rounded-full border ${qualityRingStyles[quality]}`}
            initial={false}
            animate={{
              opacity: isDragging ? 1 : 0.72,
              scale: isDragging ? 1.06 : 1,
            }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
          />
        ) : null}

        {isClosest ? (
          <motion.span
            className="pointer-events-none absolute -inset-2 rounded-full border-2 border-red-100/80 shadow-[0_0_24px_rgba(248,113,113,0.72)]"
            initial={false}
            animate={{ opacity: [0.45, 0.95, 0.45], scale: [0.96, 1.08, 0.96] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}

        <motion.span
          className="relative z-10 grid size-full place-items-center rounded-full"
          animate={{ scale: isDragging ? 0.94 : 1 }}
          whileHover={{ scale: 1.08 }}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
        >
          {icon}
        </motion.span>

        {label ? (
          <span className="pointer-events-none absolute -bottom-6 rounded-md border border-white/10 bg-black/75 px-2 py-0.5 text-[10px] font-black text-white shadow-lg backdrop-blur">
            {label}
          </span>
        ) : null}
      </button>
    </Draggable>
  );
}

const dotToneStyles: Record<PlayerDotTone, string> = {
  blue: "border-[3px] border-sky-100 bg-sky-500 text-white shadow-[0_0_22px_rgba(14,165,233,0.62)] hover:bg-sky-400",
  red: "border-[3px] border-red-100 bg-red-500 text-white shadow-[0_0_22px_rgba(239,68,68,0.66)] hover:bg-red-400",
  shooter:
    "border-4 border-orange-100 bg-orange-500 text-black shadow-[0_0_30px_rgba(255,106,0,0.76)] hover:bg-orange-400",
};

const qualityRingStyles: Record<ShotQuality, string> = {
  Average: "border-yellow-200/55 bg-yellow-300/10 shadow-[0_0_28px_rgba(250,204,21,0.28)]",
  Bad: "border-red-200/70 bg-red-500/15 shadow-[0_0_34px_rgba(248,113,113,0.42)]",
  Excellent:
    "border-green-200/75 bg-green-400/15 shadow-[0_0_36px_rgba(74,222,128,0.5)]",
  Good: "border-emerald-200/65 bg-emerald-400/12 shadow-[0_0_32px_rgba(52,211,153,0.38)]",
  Poor: "border-orange-200/70 bg-orange-500/14 shadow-[0_0_32px_rgba(251,146,60,0.38)]",
};
