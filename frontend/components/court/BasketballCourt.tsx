"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

type BasketballCourtProps = {
  children?: ReactNode;
  className?: string;
  feedbackTone?: "green" | "orange" | "red" | "sky";
  showLabels?: boolean;
  showLines?: boolean;
};

const surfaceBase: Record<
  "classic" | "pro" | "training",
  { fill: string; shadow: string }
> = {
  classic: {
    fill: "#be7b3d",
    shadow:
      "shadow-[0_30px_90px_rgba(0,0,0,0.38),inset_0_0_80px_rgba(0,0,0,0.28)]",
  },
  pro: {
    fill: "#9a5a2e",
    shadow:
      "shadow-[0_30px_90px_rgba(0,0,0,0.45),inset_0_0_80px_rgba(0,0,0,0.32)]",
  },
  training: {
    fill: "#6b7c8c",
    shadow:
      "shadow-[0_30px_90px_rgba(15,23,42,0.28),inset_0_0_80px_rgba(15,23,42,0.22)]",
  },
};

export function BasketballCourt({
  children,
  className = "",
  feedbackTone = "sky",
  showLabels = true,
  showLines = true,
}: BasketballCourtProps) {
  const courtSurface = useSettingsStore((state) => state.settings.courtSurface);
  const courtGrid = useSettingsStore((state) => state.settings.courtGrid);
  const courtHotZones = useSettingsStore((state) => state.settings.courtHotZones);
  const uid = useId().replace(/:/g, "");
  const surface = surfaceBase[courtSurface];

  return (
    <div
      className={`relative isolate aspect-[50/47] min-h-[320px] overflow-hidden rounded-lg border border-[color:var(--line)] shadow-[var(--shadow-panel)] sm:min-h-[430px] xl:min-h-[560px] ${surface.shadow} ${feedbackGlow[feedbackTone]} ${className}`}
      data-court-surface={courtSurface}
      style={{ backgroundColor: surface.fill }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 500 470"
        role="img"
        aria-label={`${courtSurface} NBA half-court`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`hardwood-base-${uid}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="var(--court-wood-1)" />
            <stop offset="0.4" stopColor="var(--court-wood-2)" />
            <stop offset="1" stopColor="var(--court-wood-3)" />
          </linearGradient>
          <pattern
            id={`hardwood-planks-${uid}`}
            width="500"
            height="42"
            patternUnits="userSpaceOnUse"
          >
            <rect width="500" height="42" fill="transparent" />
            <path
              d="M0 0H500M0 42H500"
              stroke="var(--court-plank)"
              strokeOpacity="0.3"
              strokeWidth="1.4"
            />
            <path
              d="M64 0V42M151 0V42M263 0V42M361 0V42M452 0V42"
              stroke="#fff1c4"
              strokeOpacity="0.11"
            />
            <path
              d="M16 11C82 2 142 22 209 12S326 3 484 17"
              stroke="#fff2c8"
              strokeOpacity="0.14"
              fill="none"
            />
            <path
              d="M7 30C92 40 156 24 245 33S384 46 495 29"
              stroke="var(--court-plank)"
              strokeOpacity="0.14"
              fill="none"
            />
          </pattern>
          <radialGradient id={`heat-paint-${uid}`} cx="50%" cy="16%" r="34%">
            <stop offset="0" stopColor="#ef4444" stopOpacity="0.52" />
            <stop offset="0.45" stopColor="#f97316" stopOpacity="0.28" />
            <stop offset="1" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`heat-corner-left-${uid}`} cx="7%" cy="26%" r="22%">
            <stop offset="0" stopColor="var(--court-green)" stopOpacity="0.42" />
            <stop offset="1" stopColor="var(--court-green)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`heat-corner-right-${uid}`} cx="93%" cy="26%" r="22%">
            <stop offset="0" stopColor="var(--court-green)" stopOpacity="0.42" />
            <stop offset="1" stopColor="var(--court-green)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`heat-wing-${uid}`} cx="50%" cy="62%" r="46%">
            <stop offset="0" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="0.58" stopColor="#f59e0b" stopOpacity="0.16" />
            <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <filter id={`rim-glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`paint-shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#1f1309" floodOpacity="0.24" />
          </filter>
          <pattern
            id={`court-grid-${uid}`}
            width="25"
            height="25"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M25 0H0V25"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect width="500" height="470" fill={`url(#hardwood-base-${uid})`} />
        <rect width="500" height="470" fill={`url(#hardwood-planks-${uid})`} />
        {courtHotZones ? (
          <>
            <rect width="500" height="470" fill={`url(#heat-wing-${uid})`} />
            <rect width="500" height="470" fill={`url(#heat-paint-${uid})`} />
            <rect width="500" height="470" fill={`url(#heat-corner-left-${uid})`} />
            <rect width="500" height="470" fill={`url(#heat-corner-right-${uid})`} />
          </>
        ) : null}
        {courtGrid ? (
          <rect width="500" height="470" fill={`url(#court-grid-${uid})`} opacity="0.55" />
        ) : null}
        <rect width="500" height="470" fill="rgba(58,32,13,0.12)" />
        <path
          d="M170 20V210H330V20Z"
          fill="rgba(15,23,42,0.18)"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="1"
          filter={`url(#paint-shadow-${uid})`}
        />
        <circle
          cx="250"
          cy="248"
          r="58"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
        />
        <text
          x="250"
          y="255"
          fill="rgba(255,255,255,0.08)"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="32"
          fontWeight="900"
          letterSpacing="0"
          textAnchor="middle"
        >
          SHOTOPTIX
        </text>
        <path
          d="M18 112C82 132 133 176 166 238C189 281 218 316 250 316C282 316 311 281 334 238C367 176 418 132 482 112"
          fill="none"
          stroke="rgba(15,23,42,0.16)"
          strokeDasharray="2 11"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <rect
          x="8"
          y="8"
          width="484"
          height="454"
          rx="8"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2"
        />

        {showLines ? (
          <g
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          >
            <g stroke="rgba(255,255,255,0.72)">
              <path d="M20 20H480V466H20Z" />
              <path d="M20 20H480" />
              <path d="M20 466H480" strokeOpacity="0.42" />
              <path d="M170 20V210H330V20" />
              <path d="M190 20V210H310V20" strokeOpacity="0.3" />
              <path d="M170 210A80 80 0 0 0 330 210" />
              <path d="M170 210A80 80 0 0 1 330 210" strokeDasharray="8 10" strokeOpacity="0.42" />
              <path d="M20 380H112" strokeOpacity="0.36" />
              <path d="M388 380H480" strokeOpacity="0.36" />
              <path d="M190 466A60 60 0 0 1 310 466" strokeOpacity="0.42" />
            </g>
            <g stroke="rgba(255,255,255,0.66)">
              <path d="M30 20V142" />
              <path d="M470 20V142" />
              <path d="M30 142A237.5 237.5 0 0 0 470 142" />
              <path d="M210 52.5Q250 92.5 290 52.5" strokeOpacity="0.58" />
            </g>

            <g stroke="#FF6A00" strokeWidth="4.5">
              <path d="M222 39H278" stroke="rgba(255,255,255,0.76)" />
              <circle
                cx="250"
                cy="52.5"
                r="14"
                filter={`url(#rim-glow-${uid})`}
              />
              <path d="M236 56C241 73 259 73 264 56" stroke="rgba(255,255,255,0.38)" strokeWidth="2" />
              <path d="M241 58L245 72M250 59V74M259 58L255 72" stroke="rgba(255,255,255,0.32)" strokeWidth="1.5" />
            </g>
          </g>
        ) : null}

        {showLabels ? (
          <g
            fill="rgba(255,255,255,0.72)"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="800"
            letterSpacing="0"
          >
            <text x="63" y="118" fontSize="14">
              Corner 3
            </text>
            <text x="381" y="118" fontSize="14">
              Corner 3
            </text>
            <text x="224" y="125" fontSize="16" fill="rgba(255,255,255,0.82)">
              Paint
            </text>
            <text x="215" y="302" fontSize="16">
              Mid-Range
            </text>
            <text x="216" y="354" fontSize="13" fill="rgba(255,255,255,0.58)">
              Above Break
            </text>
          </g>
        ) : null}
      </svg>

      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.22)_48%,transparent_54%),linear-gradient(0deg,rgba(0,0,0,0.32),transparent_24%,transparent_76%,rgba(0,0,0,0.28))] [background-size:180px_100%,100%_100%]" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

const feedbackGlow = {
  green: "shadow-green-500/10",
  orange: "shadow-orange-500/10",
  red: "shadow-red-500/10",
  sky: "shadow-sky-500/10",
};
