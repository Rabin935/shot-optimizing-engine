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
      className={`relative isolate aspect-[50/47] min-h-[360px] overflow-hidden rounded-lg border border-white/10 bg-[#c99252] shadow-[inset_0_0_70px_rgba(0,0,0,0.28)] sm:min-h-[460px] xl:min-h-[560px] ${className}`}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 500 470"
        role="img"
        aria-label="Detailed SVG NBA half-court"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="hardwood-base" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#f0c47a" />
            <stop offset="0.45" stopColor="#c98a43" />
            <stop offset="1" stopColor="#9f6230" />
          </linearGradient>
          <pattern
            id="hardwood-planks"
            width="500"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <rect width="500" height="48" fill="transparent" />
            <path d="M0 0H500M0 48H500" stroke="#6f3f1f" strokeOpacity="0.28" strokeWidth="1.5" />
            <path d="M76 0V48M184 0V48M307 0V48M426 0V48" stroke="#fff2ca" strokeOpacity="0.1" />
            <path d="M24 12C88 4 139 24 206 13S326 5 476 18" stroke="#fff0c6" strokeOpacity="0.12" fill="none" />
            <path d="M9 33C92 43 152 26 242 36S384 48 494 32" stroke="#5f3319" strokeOpacity="0.13" fill="none" />
          </pattern>
          <radialGradient id="heat-paint" cx="50%" cy="16%" r="34%">
            <stop offset="0" stopColor="#ef4444" stopOpacity="0.52" />
            <stop offset="0.45" stopColor="#f97316" stopOpacity="0.28" />
            <stop offset="1" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="heat-corner-left" cx="7%" cy="26%" r="22%">
            <stop offset="0" stopColor="#22c55e" stopOpacity="0.42" />
            <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="heat-corner-right" cx="93%" cy="26%" r="22%">
            <stop offset="0" stopColor="#22c55e" stopOpacity="0.42" />
            <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="heat-wing" cx="50%" cy="62%" r="46%">
            <stop offset="0" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="0.58" stopColor="#f59e0b" stopOpacity="0.16" />
            <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <filter id="rim-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="500" height="470" fill="url(#hardwood-base)" />
        <rect width="500" height="470" fill="url(#hardwood-planks)" />
        <rect width="500" height="470" fill="url(#heat-wing)" />
        <rect width="500" height="470" fill="url(#heat-paint)" />
        <rect width="500" height="470" fill="url(#heat-corner-left)" />
        <rect width="500" height="470" fill="url(#heat-corner-right)" />
        <rect width="500" height="470" fill="rgba(58,32,13,0.12)" />
        <path
          d="M170 20V210H330V20Z"
          fill="rgba(30,64,175,0.16)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
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

      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.2)_48%,transparent_54%),linear-gradient(0deg,rgba(0,0,0,0.32),transparent_24%,transparent_76%,rgba(0,0,0,0.28))] [background-size:180px_100%,100%_100%]" />
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}
