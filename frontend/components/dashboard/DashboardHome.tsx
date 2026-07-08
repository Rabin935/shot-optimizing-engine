"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Clock3,
  FileText,
  Flame,
  Gauge,
  LineChart,
  PlayCircle,
  Radar,
  Sparkles,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type QuickAction = {
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
};

const quickActions: QuickAction[] = [
  {
    description: "Court spacing lab",
    href: "/sandbox",
    icon: Target,
    label: "Open Sandbox",
  },
  {
    description: "Replay shot motion",
    href: "/simulator",
    icon: PlayCircle,
    label: "Open Simulator",
  },
  {
    description: "Find stronger looks",
    href: "/optimizer",
    icon: BrainCircuit,
    label: "Run Optimizer",
  },
  {
    description: "Export findings",
    href: "/reports",
    icon: FileText,
    label: "View Reports",
  },
];

const overviewPanels = [
  {
    icon: Activity,
    label: "Session Window",
    value: "Live workspace",
  },
  {
    icon: Gauge,
    label: "Model Mode",
    value: "ML + fallback",
  },
  {
    icon: Sparkles,
    label: "Phase",
    value: "Product polish",
  },
];

export function DashboardHome() {
  // Phase 6 turns the dashboard into the central navigation and analytics surface.
  return (
    <section className="grid gap-6">
      <WelcomeBanner />

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          <SectionFrame
            eyebrow="Overview"
            icon={BarChart3}
            title="Application summary"
          >
            <div className="grid gap-3 md:grid-cols-3">
              {overviewPanels.map((panel) => (
                <OverviewTile
                  key={panel.label}
                  icon={panel.icon}
                  label={panel.label}
                  value={panel.value}
                />
              ))}
            </div>
          </SectionFrame>

          <SectionFrame
            eyebrow="Analytics"
            icon={LineChart}
            title="Performance trends"
          >
            <PlaceholderGrid
              items={[
                "EPPS Trend",
                "Make Probability Trend",
                "Shot Zone Distribution",
              ]}
            />
          </SectionFrame>

          <SectionFrame
            eyebrow="Work Queue"
            icon={Radar}
            title="Recent simulations and optimizer notes"
          >
            <PlaceholderGrid
              items={[
                "Recent Simulations Table",
                "Recent Optimizer Recommendations",
                "Latest Coaching Feedback",
              ]}
            />
          </SectionFrame>
        </div>

        <aside className="grid content-start gap-5">
          <SectionFrame
            eyebrow="Status"
            icon={Gauge}
            title="Sidebar widgets"
          >
            <PlaceholderGrid
              items={[
                "Prediction Engine Status",
                "Replay History",
                "Favorite Simulations",
              ]}
            />
          </SectionFrame>

          <SectionFrame eyebrow="System" icon={Clock3} title="Activity stream">
            <PlaceholderGrid
              items={[
                "Recent Activity Timeline",
                "System Information",
                "Version Information",
              ]}
            />
          </SectionFrame>
        </aside>
      </section>
    </section>
  );
}

function WelcomeBanner() {
  // The banner combines session context with quick entry points into core flows.
  return (
    <header className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1fr_520px] xl:items-end">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">
            ShotOptix Control Center
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
            Monitor simulations, optimizer output, model health, saved replays,
            and reporting momentum from one professional home base.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {quickActions.map((action) => (
            <QuickActionLink key={action.href} action={action} />
          ))}
        </div>
      </div>
    </header>
  );
}

function QuickActionLink({ action }: { action: QuickAction }) {
  const Icon = action.icon;

  return (
    <Link
      href={action.href}
      className="group flex min-h-20 items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 p-4 transition hover:border-orange-300/40 hover:bg-orange-500/15"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-green-300/25 bg-green-400/10 text-green-100">
          <Icon className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black text-white">
            {action.label}
          </span>
          <span className="mt-1 block truncate text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {action.description}
          </span>
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-orange-200" />
    </Link>
  );
}

function SectionFrame({
  children,
  eyebrow,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
}) {
  // SectionFrame provides consistent density, borders, and labels across panels.
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <div className="mb-4 flex items-start gap-3 border-b border-white/10 pb-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-orange-300/25 bg-orange-500/10 text-orange-100">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-300">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-white">
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function OverviewTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-black/30 p-4">
      <Icon className="size-5 text-orange-200" />
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </article>
  );
}

function PlaceholderGrid({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((item) => (
        <div
          key={item}
          className="min-h-24 rounded-lg border border-dashed border-white/10 bg-black/25 p-4"
        >
          <p className="text-sm font-black text-slate-200">{item}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ready for phase-6 dashboard data.
          </p>
        </div>
      ))}
    </div>
  );
}

