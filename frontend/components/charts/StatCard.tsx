import type { ReactNode } from "react";
import type { DesignTone } from "@/lib/design-system";
import { cx, toneClasses } from "@/lib/design-system";

type StatCardProps = {
  icon?: ReactNode;
  label: string;
  tone?: "green" | "neutral" | "orange" | "red";
  value: string;
};

const toneMap: Record<NonNullable<StatCardProps["tone"]>, DesignTone> = {
  green: "success",
  neutral: "neutral",
  orange: "primary",
  red: "danger",
};

export function StatCard({ icon, label, tone = "neutral", value }: StatCardProps) {
  const semanticTone = toneClasses[toneMap[tone]];

  // StatCard is intentionally dense so dashboards can scan like an ops console.
  return (
    <article
      className={cx(
        "rounded-lg border p-4",
        semanticTone.border,
        semanticTone.soft,
        semanticTone.text,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-black tracking-tight">
            {value}
          </p>
        </div>
        {icon ? (
          <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-current/20 bg-black/20">
            {icon}
          </span>
        ) : null}
      </div>
    </article>
  );
}
