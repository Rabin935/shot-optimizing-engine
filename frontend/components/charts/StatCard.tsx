import type { ReactNode } from "react";

type StatCardProps = {
  icon?: ReactNode;
  label: string;
  tone?: "green" | "neutral" | "orange" | "red";
  value: string;
};

const toneClasses = {
  green: "border-green-300/25 bg-green-400/10 text-green-100",
  neutral: "border-white/10 bg-white/[0.045] text-white",
  orange: "border-orange-300/25 bg-orange-500/10 text-orange-100",
  red: "border-red-300/25 bg-red-500/10 text-red-100",
};

export function StatCard({ icon, label, tone = "neutral", value }: StatCardProps) {
  // StatCard is intentionally dense so dashboards can scan like an ops console.
  return (
    <article className={`rounded-lg border p-4 ${toneClasses[tone]}`}>
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
