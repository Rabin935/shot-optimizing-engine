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
    "rounded-lg border border-[color:var(--line)] bg-panel shadow-[var(--shadow-panel)]",
  surfaceMuted: "rounded-lg border border-[color:var(--line)] bg-panel-muted",
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
    text: "text-danger",
  },
  neutral: {
    border: "border-[color:var(--line)]",
    soft: "bg-neutral-soft",
    text: "text-foreground",
  },
  primary: {
    border: "border-primary/30",
    soft: "bg-primary-soft",
    text: "text-primary-strong",
  },
  secondary: {
    border: "border-secondary/25",
    soft: "bg-secondary-soft",
    text: "text-secondary",
  },
  success: {
    border: "border-success/25",
    soft: "bg-success-soft",
    text: "text-success",
  },
  warning: {
    border: "border-warning/25",
    soft: "bg-warning-soft",
    text: "text-warning",
  },
};

export function cx(...classes: Array<false | null | string | undefined>) {
  // Tiny class combiner keeps components dependency-free and readable.
  return classes.filter(Boolean).join(" ");
}
