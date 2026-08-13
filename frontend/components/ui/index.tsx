import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TableHTMLAttributes,
} from "react";
import type { DesignTone } from "@/lib/design-system";
import { cx, designTokens, toneClasses } from "@/lib/design-system";

type Size = "sm" | "md" | "lg";
type ButtonVariant = "ghost" | "outline" | "primary" | "secondary" | "subtle";

const buttonSizes: Record<Size, string> = {
  lg: "min-h-12 px-5 text-base",
  md: "min-h-10 px-3 text-sm",
  sm: "min-h-9 px-3 text-xs",
};

const buttonVariants: Record<ButtonVariant, string> = {
  ghost:
    "border-transparent bg-transparent text-muted-foreground hover:bg-[color:var(--sidebar-hover)] hover:text-foreground",
  outline:
    "border-[color:var(--line)] bg-panel text-foreground hover:border-primary/35 hover:bg-primary-soft",
  primary:
    "border-primary/35 bg-primary-soft text-primary-strong hover:border-orange-200/55 hover:bg-orange-500/20",
  secondary:
    "border-secondary/30 bg-secondary-soft text-secondary hover:border-sky-200/50 hover:bg-sky-400/20",
  subtle:
    "border-[color:var(--line)] bg-panel-muted text-foreground hover:border-[color:var(--line)] hover:bg-[color:var(--sidebar-hover)]",
};

export function Button({
  children,
  className,
  size = "md",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: Size;
  variant?: ButtonVariant;
}) {
  // Button centralizes hit area, focus, and hover treatment across the app.
  return (
    <button
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border font-black transition disabled:cursor-not-allowed disabled:opacity-50",
        designTokens.focusRing,
        buttonSizes[size],
        buttonVariants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        "grid size-8 shrink-0 place-items-center rounded-md border border-[color:var(--line)] bg-panel text-muted-foreground transition hover:border-orange-300/35 hover:text-primary-strong",
        designTokens.focusRing,
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className,
  padding = "md",
  ...props
}: HTMLAttributes<HTMLElement> & {
  padding?: "lg" | "md" | "sm";
}) {
  const paddingClasses = {
    lg: "p-5 sm:p-6",
    md: "p-4",
    sm: "p-3",
  };

  return (
    <section
      className={cx(designTokens.surface, paddingClasses[padding], className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  action,
  children,
  className,
  eyebrow,
  icon,
  title,
}: {
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  eyebrow?: string;
  icon?: ReactNode;
  title: string;
}) {
  // CardHeader standardizes page section hierarchy and optional actions.
  return (
    <div
      className={cx(
        "mb-4 flex flex-col gap-3 border-b border-[color:var(--line)] pb-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary-soft text-orange-100">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <Heading level={2}>{title}</Heading>
          {children ? (
            <div className="mt-1 text-sm leading-6 text-muted-foreground">
              {children}
            </div>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Heading({
  children,
  className,
  level = 1,
}: {
  children: ReactNode;
  className?: string;
  level?: 1 | 2 | 3;
}) {
  const Tag = `h${level}` as const;
  const levelClasses = {
    1: "text-[length:var(--text-title)] font-black tracking-tight text-foreground",
    2: "text-xl font-black tracking-tight text-foreground",
    3: "text-base font-black text-foreground",
  };

  return <Tag className={cx(levelClasses[level], className)}>{children}</Tag>;
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cx(
        "text-xs font-bold uppercase tracking-[0.18em] text-green-300",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function Text({
  children,
  className,
  muted = false,
}: {
  children: ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <p
      className={cx(
        "text-sm leading-6",
        muted ? "text-muted-foreground" : "text-foreground/90",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: DesignTone;
}) {
  const toneClass = toneClasses[tone];

  return (
    <span
      className={cx(
        "inline-flex min-h-7 items-center rounded-md border px-2 text-xs font-black",
        toneClass.border,
        toneClass.soft,
        toneClass.text,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusChip({
  children,
  className,
  tone = "success",
}: {
  children: ReactNode;
  className?: string;
  tone?: DesignTone;
}) {
  const toneClass = toneClasses[tone];

  return (
    <span
      className={cx(
        "inline-flex min-h-8 items-center gap-2 rounded-lg border px-2.5 text-xs font-black",
        toneClass.border,
        toneClass.soft,
        toneClass.text,
        className,
      )}
    >
      <span className="size-2 rounded-full bg-current shadow-[0_0_14px_currentColor]" />
      {children}
    </span>
  );
}

export function DataTable({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[color:var(--line)] bg-panel-muted">
      <table className={cx("w-full min-w-[640px] text-left text-sm", className)} {...props} />
    </div>
  );
}

export function TableHead({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cx("text-xs font-bold uppercase tracking-[0.14em] text-subtle-foreground", className)}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return <td className={cx("border-b border-white/5 py-3 pr-3", className)} {...props} />;
}

export function FieldLabel({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cx("text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground", className)}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "min-h-10 w-full rounded-lg border border-[color:var(--line)] bg-panel-strong px-3 text-sm font-bold text-foreground transition placeholder:text-subtle-foreground",
        "focus:border-primary/45",
        designTokens.focusRing,
        className,
      )}
      {...props}
    />
  );
}

export function Dropdown({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        "min-h-10 w-full rounded-lg border border-[color:var(--line)] bg-panel-strong px-3 text-sm font-bold text-foreground transition",
        "focus:border-primary/45",
        designTokens.focusRing,
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Dialog({
  children,
  className,
  labelledBy,
  open,
}: {
  children: ReactNode;
  className?: string;
  labelledBy: string;
  open: boolean;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <section
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={cx("w-full max-w-xl rounded-lg border border-[color:var(--line)] bg-surface p-5 shadow-[var(--shadow-elevated)]", className)}
        role="dialog"
      >
        {children}
      </section>
    </div>
  );
}

export function Tabs({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div aria-label={label} className={cx("flex flex-wrap gap-2", className)} role="tablist">
      {children}
    </div>
  );
}

export function TabButton({
  active = false,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
}) {
  return (
    <button
      aria-selected={active}
      className={cx(
        "min-h-10 rounded-lg border px-3 text-sm font-black transition",
        designTokens.focusRing,
        active
          ? "border-primary/35 bg-primary-soft text-orange-100"
          : "border-[color:var(--line)] bg-panel text-muted-foreground hover:text-foreground",
        className,
      )}
      role="tab"
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function Tooltip({
  children,
  content,
}: {
  children: ReactNode;
  content: ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden max-w-56 -translate-x-1/2 rounded-md border border-[color:var(--line)] bg-surface px-2 py-1 text-xs font-bold text-foreground shadow-xl group-hover:block group-focus-within:block"
        role="tooltip"
      >
        {content}
      </span>
    </span>
  );
}

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("animate-pulse rounded-lg bg-white/[0.08]", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export function EmptyState({
  action,
  children,
  className,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <section className={cx("rounded-lg border border-dashed border-white/15 bg-panel-muted p-5 text-center", className)}>
      <Heading level={3}>{title}</Heading>
      <Text className="mx-auto mt-2 max-w-xl" muted>
        {children}
      </Text>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </section>
  );
}

export function Notification({
  children,
  className,
  title,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  title: string;
  tone?: DesignTone;
}) {
  const toneClass = toneClasses[tone];

  return (
    <section
      className={cx(
        "rounded-lg border p-4",
        toneClass.border,
        toneClass.soft,
        toneClass.text,
        className,
      )}
      role={tone === "danger" ? "alert" : "status"}
    >
      <p className="text-sm font-black text-foreground">{title}</p>
      <Text className="mt-1" muted={false}>
        {children}
      </Text>
    </section>
  );
}
