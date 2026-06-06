"use client";

import { Shield } from "lucide-react";
import { PlayerDot } from "@/components/sandbox/PlayerDot";
import type {
  CourtPoint,
  CourtSize,
  SandboxDefender,
} from "@/lib/sandbox-metrics";

type DefenderDotProps = {
  courtSize: CourtSize;
  defender: SandboxDefender;
  isClosest: boolean;
  markerSize: number;
  onMove: (point: CourtPoint) => void;
};

export function DefenderDot({
  courtSize,
  defender,
  isClosest,
  markerSize,
  onMove,
}: DefenderDotProps) {
  return (
    <PlayerDot
      ariaLabel={`Drag defender ${defender.label}`}
      courtSize={courtSize}
      icon={<Shield className="size-5" />}
      isClosest={isClosest}
      label={defender.label}
      markerSize={markerSize}
      onMove={onMove}
      point={defender.point}
      tone={defender.tone}
    />
  );
}
