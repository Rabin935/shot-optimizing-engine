export type DesignTone =
  | "danger"
  | "neutral"
  | "primary"
  | "secondary"
  | "success"
  | "warning";

export const designTokens = {
  // Centralized class tokens prevent one-off spacing and surface drift.
  focusRing:
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-200",
  radius: "rounded-lg",
  sectionGap: "gap-6",
  surface:
    "rounded-lg border border-white/10 bg-panel shadow-[var(--shadow-panel)]",
  surfaceMuted: "rounded-lg border border-white/10 bg-panel-muted",
};

export const toneClasses: Record<
  DesignTone,
  {
    border: string;
    soft: string;
    text: string;
  }
> = {
  danger: {
    border: "border-danger/25",
    soft: "bg-danger-soft",
    text: "text-red-100",
  },
  neutral: {
    border: "border-white/10",
    soft: "bg-neutral-soft",
    text: "text-slate-100",
  },
  primary: {
    border: "border-primary/30",
    soft: "bg-primary-soft",
    text: "text-orange-100",
  },
  secondary: {
    border: "border-secondary/25",
    soft: "bg-secondary-soft",
    text: "text-sky-100",
  },
  success: {
    border: "border-success/25",
    soft: "bg-success-soft",
    text: "text-green-100",
  },
  warning: {
    border: "border-warning/25",
    soft: "bg-warning-soft",
    text: "text-yellow-100",
  },
};

export function cx(...classes: Array<false | null | string | undefined>) {
  // Tiny class combiner keeps components dependency-free and readable.
  return classes.filter(Boolean).join(" ");
}
