import type { ReactNode } from "react";

type BasketballCourtProps = {
  children?: ReactNode;
  className?: string;
  showLines?: boolean;
};

export function BasketballCourt({
  children,
  className = "",
  showLines = true,
}: BasketballCourtProps) {
  return (
    <div
      className={`relative isolate aspect-[50/47] min-h-[420px] overflow-hidden rounded-lg border border-white/10 bg-[#1A472A] shadow-[inset_0_0_70px_rgba(0,0,0,0.28)] ${className}`}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 500 470"
        role="img"
        aria-label="Detailed SVG NBA half-court"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="court-texture"
            width="34"
            height="34"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 0H34M0 17H34M17 0V34" stroke="#ffffff" strokeOpacity="0.035" />
          </pattern>
          <filter id="rim-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="500" height="470" fill="#1A472A" />
        <rect width="500" height="470" fill="url(#court-texture)" />
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
                filter="url(#rim-glow)"
              />
              <path d="M236 56C241 73 259 73 264 56" stroke="rgba(255,255,255,0.38)" strokeWidth="2" />
              <path d="M241 58L245 72M250 59V74M259 58L255 72" stroke="rgba(255,255,255,0.32)" strokeWidth="1.5" />
            </g>
          </g>
        ) : null}

        {showLines ? (
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
          </g>
        ) : null}
      </svg>

      <div className="absolute inset-0">{children}</div>
    </div>
  );
}
