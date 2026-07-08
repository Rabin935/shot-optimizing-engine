"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  BrainCircuit,
  Clock3,
  FileText,
  Gauge,
  LineChart as LineChartIcon,
  Percent,
  PlayCircle,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "@/components/charts";
import {
  Badge,
  Card,
  CardHeader,
  DataTable,
  Eyebrow,
  Heading,
  StatusChip,
  TableCell,
  TableHead,
  Text,
} from "@/components/ui";
import { cx, toneClasses } from "@/lib/design-system";
import { useShotStore } from "@/store/useShotStore";

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
  const replayHistory = useShotStore((state) => state.replayHistory);
  const epps = useShotStore((state) => state.epps);
  const makeProbability = useShotStore((state) => state.makeProbability);
  const predictionSource = useShotStore((state) => state.predictionSource);
  const recommendation = useShotStore((state) => state.recommendation);
  const optimizedShot = useShotStore((state) => state.optimizedShot);
  const trendRows = buildTrendRows(replayHistory, epps, makeProbability);
  const zoneRows = buildZoneRows(replayHistory);
  const activityRows = buildActivityRows(replayHistory);
  const recentRows = buildRecentSimulationRows(replayHistory);
  const recommendationRows = buildRecommendationRows(optimizedShot?.title);
  const coachingRows = buildCoachingRows(recommendation);
  const stats = buildDashboardStats({
    epps,
    makeProbability,
    optimizedShotTitle: optimizedShot?.title,
    predictionSource,
    replayHistory,
  });

  // Phase 6 turns the dashboard into the central navigation and analytics surface.
  return (
    <section className="grid gap-6">
      <WelcomeBanner
        makeProbability={stats.averageMakeProbability}
        recommendation={recommendation}
        replayCount={stats.totalSimulations}
        sessionEpps={stats.averageEpps}
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {stats.cards.map((card) => (
              <DashboardStatCard key={card.label} card={card} />
            ))}
          </section>

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
            icon={LineChartIcon}
            title="Performance trends"
          >
            <DashboardCharts trendRows={trendRows} zoneRows={zoneRows} />
          </SectionFrame>

          <SectionFrame
            eyebrow="Work Queue"
            icon={Radar}
            title="Recent simulations and optimizer notes"
          >
            <div className="grid gap-4 2xl:grid-cols-[1.25fr_0.9fr_0.9fr]">
              <RecentSimulationsTable rows={recentRows} />
              <OptimizerRecommendations rows={recommendationRows} />
              <CoachingFeedback rows={coachingRows} />
            </div>
          </SectionFrame>
        </div>

        <aside className="grid content-start gap-5">
          <SectionFrame
            eyebrow="Status"
            icon={Gauge}
            title="Sidebar widgets"
          >
            <div className="grid gap-3">
              <PredictionEngineWidget predictionSource={predictionSource} />
              <ReplayHistoryWidget replayCount={replayHistory.length} />
              <FavoriteSimulationsWidget />
            </div>
          </SectionFrame>

          <SectionFrame eyebrow="System" icon={Clock3} title="Activity stream">
            <ActivityTimeline rows={activityRows} />
          </SectionFrame>
        </aside>
      </section>

      <BottomOperationsSection activityRows={activityRows} />
    </section>
  );
}

function WelcomeBanner({
  makeProbability,
  recommendation,
  replayCount,
  sessionEpps,
}: {
  makeProbability: string;
  recommendation: string;
  replayCount: number;
  sessionEpps: string;
}) {
  // The banner combines session context with quick entry points into core flows.
  return (
    <header className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1fr_560px] xl:items-end">
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
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SessionPill label="Simulations" value={`${replayCount}`} />
            <SessionPill label="Session EPPS" value={sessionEpps} />
            <SessionPill label="Make Rate" value={makeProbability} />
          </div>
          <p className="mt-4 max-w-3xl rounded-lg border border-green-300/15 bg-green-400/10 p-3 text-sm font-bold leading-6 text-green-100">
            {recommendation}
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

function SessionPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
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

type DashboardStat = {
  icon: LucideIcon;
  label: string;
  tone: "green" | "neutral" | "orange";
  value: string;
};

function DashboardStatCard({ card }: { card: DashboardStat }) {
  const Icon = card.icon;
  const mappedTone = {
    green: toneClasses.success,
    neutral: toneClasses.neutral,
    orange: toneClasses.primary,
  };
  const tone = mappedTone[card.tone];

  return (
    <article className={cx("rounded-lg border p-4", tone.border, tone.soft, tone.text)}>
      <div className="flex min-h-24 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">
            {card.label}
          </p>
          <p className="mt-3 truncate text-2xl font-black tracking-tight">
            {card.value}
          </p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-current/20 bg-black/20">
          <Icon className="size-5" />
        </span>
      </div>
    </article>
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
    <Card>
      <CardHeader
        eyebrow={eyebrow}
        title={title}
        className="flex-row items-start justify-start"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-orange-300/25 bg-orange-500/10 text-orange-100">
          <Icon className="size-5" />
        </span>
      </CardHeader>
      {children}
    </Card>
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
    <Card padding="sm" className="bg-panel-muted">
      <Icon className="size-5 text-orange-200" />
      <Eyebrow className="mt-4 text-slate-500">{label}</Eyebrow>
      <Heading className="mt-2 text-lg" level={3}>{value}</Heading>
    </Card>
  );
}

type TrendRow = {
  epps: number;
  makeProbability: number;
  name: string;
};

type ZoneRow = {
  attempts: number;
  fill: string;
  zone: string;
};

type ActivityRow = {
  description: string;
  label: string;
  status: "green" | "orange";
};

type RecentSimulationRow = {
  epps: string;
  makeProbability: string;
  mechanics: string;
  pressure: string;
  shot: string;
  zone: string;
};

type RecommendationRow = {
  delta: string;
  label: string;
  value: string;
};

type CoachingRow = {
  label: string;
  message: string;
  tone: "green" | "orange";
};

function DashboardCharts({
  trendRows,
  zoneRows,
}: {
  trendRows: TrendRow[];
  zoneRows: ZoneRow[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
      <ChartPanel title="EPPS Trend">
        <ChartContainer height={260}>
          <LineChart data={trendRows} margin={{ bottom: 8, left: -18, right: 10, top: 12 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.09)" strokeDasharray="4 4" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} tickLine={false} />
            <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} tickLine={false} />
            <Tooltip content={<TrendTooltip metric="epps" />} />
            <Line type="monotone" dataKey="epps" stroke="#86efac" strokeWidth={3} dot={{ fill: "#86efac", r: 3 }} />
          </LineChart>
        </ChartContainer>
      </ChartPanel>

      <ChartPanel title="Make Probability Trend">
        <ChartContainer height={260}>
          <LineChart data={trendRows} margin={{ bottom: 8, left: -18, right: 10, top: 12 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.09)" strokeDasharray="4 4" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} tickLine={false} />
            <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} tickLine={false} />
            <Tooltip content={<TrendTooltip metric="makeProbability" />} />
            <Line type="monotone" dataKey="makeProbability" stroke="#fb923c" strokeWidth={3} dot={{ fill: "#fb923c", r: 3 }} />
          </LineChart>
        </ChartContainer>
      </ChartPanel>

      <ChartPanel title="Shot Zone Distribution">
        <ChartContainer height={260}>
          <BarChart data={zoneRows} margin={{ bottom: 8, left: -18, right: 10, top: 12 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.09)" strokeDasharray="4 4" />
            <XAxis dataKey="zone" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 800 }} tickLine={false} />
            <YAxis allowDecimals={false} stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} tickLine={false} />
            <Tooltip content={<ZoneTooltip />} />
            <Bar dataKey="attempts" radius={[6, 6, 0, 0]}>
              {zoneRows.map((row) => (
                <Cell key={row.zone} fill={row.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </ChartPanel>
    </div>
  );
}

function RecentSimulationsTable({ rows }: { rows: RecentSimulationRow[] }) {
  return (
    <Card padding="sm" className="min-w-0 bg-panel-muted">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="size-4 text-green-200" />
        <Heading className="text-sm" level={3}>Recent Simulations</Heading>
      </div>
      <DataTable aria-label="Recent simulations">
          <TableHead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-3">Shot</th>
              <th className="py-2 pr-3">Zone</th>
              <th className="py-2 pr-3">Pressure</th>
              <th className="py-2 pr-3">EPPS</th>
              <th className="py-2 pr-3">Make</th>
              <th className="py-2">Mechanics</th>
            </tr>
          </TableHead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.shot}-${row.zone}`} className="border-b border-white/5 last:border-0">
                <TableCell className="font-black text-white">{row.shot}</TableCell>
                <TableCell className="font-bold text-slate-300">{row.zone}</TableCell>
                <TableCell className="font-bold text-slate-300">{row.pressure}</TableCell>
                <TableCell className="font-black text-green-200">{row.epps}</TableCell>
                <TableCell className="font-black text-orange-100">{row.makeProbability}</TableCell>
                <TableCell className="font-black text-white">{row.mechanics}</TableCell>
              </tr>
            ))}
          </tbody>
      </DataTable>
    </Card>
  );
}

function OptimizerRecommendations({ rows }: { rows: RecommendationRow[] }) {
  return (
    <Card padding="sm" className="bg-panel-muted">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="size-4 text-orange-200" />
        <Heading className="text-sm" level={3}>Recent Optimizer Recommendations</Heading>
      </div>
      <div className="grid gap-3">
        {rows.map((row) => (
          <Card key={row.label} padding="sm">
            <Eyebrow className="text-slate-500">{row.label}</Eyebrow>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-white">{row.value}</p>
              <Badge tone="success">{row.delta}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}

function CoachingFeedback({ rows }: { rows: CoachingRow[] }) {
  return (
    <Card padding="sm" className="bg-panel-muted">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="size-4 text-green-200" />
        <Heading className="text-sm" level={3}>Latest Coaching Feedback</Heading>
      </div>
      <div className="grid gap-3">
        {rows.map((row) => (
          <Card key={row.label} padding="sm" className={row.tone === "green" ? "bg-success-soft" : "bg-primary-soft"}>
            <Eyebrow className="text-slate-400">{row.label}</Eyebrow>
            <Text className="mt-2 font-bold text-white">{row.message}</Text>
          </Card>
        ))}
      </div>
    </Card>
  );
}

function BottomOperationsSection({
  activityRows,
}: {
  activityRows: ActivityRow[];
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
      <SectionFrame
        eyebrow="Activity"
        icon={Clock3}
        title="Recent activity timeline"
      >
        <ActivityTimeline rows={activityRows} />
      </SectionFrame>

      <SectionFrame eyebrow="System" icon={Gauge} title="System information">
        <div className="grid gap-3">
          <SystemInfoRow label="Prediction API" value="Ready" />
          <SystemInfoRow label="Dashboard Data" value="Live + synthetic" />
          <SystemInfoRow label="Reports Export" value="Available" />
          <SystemInfoRow label="Performance Mode" value="Responsive charts" />
        </div>
      </SectionFrame>

      <SectionFrame eyebrow="Release" icon={FileText} title="Version information">
        <div className="grid gap-3">
          <SystemInfoRow label="Product Phase" value="Phase 6" />
          <SystemInfoRow label="Dashboard Step" value="6.1" />
          <SystemInfoRow label="Next Runtime" value="16.2.4" />
          <SystemInfoRow label="Phase 7 Readiness" value="In progress" />
          <Link
            href="/reports"
            className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-orange-300/25 bg-orange-500/10 px-3 text-sm font-black text-orange-100 transition hover:border-orange-200/50 hover:bg-orange-500/20"
          >
            Advanced Reports & Export
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </SectionFrame>
    </section>
  );
}

function SystemInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="sm" className="flex min-h-12 items-center justify-between gap-3 bg-panel-muted">
      <Eyebrow className="text-slate-500">{label}</Eyebrow>
      <span className="text-right text-sm font-black text-white">{value}</span>
    </Card>
  );
}

function ChartPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Card padding="sm" className="min-w-0 bg-panel-muted">
      <Heading className="mb-3 text-sm" level={3}>{title}</Heading>
      {children}
    </Card>
  );
}

function PredictionEngineWidget({
  predictionSource,
}: {
  predictionSource: string;
}) {
  const sourceLabel =
    predictionSource === "ml_model"
      ? "ML model"
      : predictionSource === "rule_based_fallback"
        ? "Fallback model"
        : "Prediction engine";

  return (
    <WidgetRow
      icon={BrainCircuit}
      label="Prediction Engine Status"
      meta="Healthy"
      value={sourceLabel}
    />
  );
}

function ReplayHistoryWidget({ replayCount }: { replayCount: number }) {
  return (
    <WidgetRow
      icon={PlayCircle}
      label="Replay History"
      meta="Saved sessions"
      value={replayCount ? `${replayCount} replays` : "Synthetic mode"}
    />
  );
}

function FavoriteSimulationsWidget() {
  return (
    <WidgetRow
      icon={Trophy}
      label="Favorite Simulations"
      meta="Pinned review"
      value="3 curated looks"
    />
  );
}

function WidgetRow({
  icon: Icon,
  label,
  meta,
  value,
}: {
  icon: LucideIcon;
  label: string;
  meta: string;
  value: string;
}) {
  return (
    <Card padding="sm" className="flex items-center gap-3 bg-panel-muted">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-green-300/25 bg-green-400/10 text-green-100">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-white">{label}</p>
        <p className="mt-1 truncate text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          {meta}
        </p>
      </div>
      <StatusChip className="ml-auto max-w-32 truncate" tone="primary">
        {value}
      </StatusChip>
    </Card>
  );
}

function ActivityTimeline({ rows }: { rows: ActivityRow[] }) {
  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <Card
          padding="sm"
          key={`${row.label}-${row.description}`}
          className="relative bg-panel-muted pl-9"
        >
          <span
            className={`absolute left-3 top-4 size-3 rounded-full ${
              row.status === "green" ? "bg-green-300" : "bg-orange-300"
            }`}
          />
          <p className="text-sm font-black text-white">{row.label}</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            {row.description}
          </p>
        </Card>
      ))}
    </div>
  );
}

function TrendTooltip({
  active,
  metric,
  payload,
}: {
  active?: boolean;
  metric: "epps" | "makeProbability";
  payload?: Array<{ payload: TrendRow }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0].payload;
  const value =
    metric === "epps" ? formatDecimal(row.epps) : formatPercent(row.makeProbability);

  return (
    <div className="rounded-lg border border-white/10 bg-[#090909]/95 p-3 text-sm shadow-2xl">
      <p className="font-black text-white">{row.name}</p>
      <p className="mt-1 text-xs font-bold text-slate-300">{value}</p>
    </div>
  );
}

function ZoneTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ZoneRow }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-[#090909]/95 p-3 text-sm shadow-2xl">
      <p className="font-black text-white">{row.zone}</p>
      <p className="mt-1 text-xs font-bold text-slate-300">
        {row.attempts} attempts
      </p>
    </div>
  );
}

function buildDashboardStats({
  epps,
  makeProbability,
  optimizedShotTitle,
  predictionSource,
  replayHistory,
}: {
  epps: number;
  makeProbability: number;
  optimizedShotTitle?: string;
  predictionSource: string;
  replayHistory: ReturnType<typeof useShotStore.getState>["replayHistory"];
}) {
  // Synthetic defaults keep the dashboard populated before users save replays.
  const synthetic = {
    averageEpps: 1.18,
    averageMakeProbability: 0.47,
    averageMechanicsScore: 84,
    bestShot: optimizedShotTitle ?? "Corner three",
    totalSimulations: 128,
  };
  const totalSimulations = replayHistory.length || synthetic.totalSimulations;
  const averageEpps = replayHistory.length
    ? average(replayHistory.map((replay) => replay.metrics.epps))
    : epps || synthetic.averageEpps;
  const averageMakeProbability = replayHistory.length
    ? average(replayHistory.map((replay) => replay.metrics.makeProbability))
    : makeProbability || synthetic.averageMakeProbability;
  const averageMechanicsScore = replayHistory.length
    ? average(replayHistory.map((replay) => replay.mechanicsScore.overallForm))
    : synthetic.averageMechanicsScore;
  const bestReplay = replayHistory.reduce(
    (best, replay) =>
      replay.metrics.epps > (best?.metrics.epps ?? Number.NEGATIVE_INFINITY)
        ? replay
        : best,
    replayHistory[0],
  );
  const bestShot =
    optimizedShotTitle ??
    (bestReplay
      ? `${bestReplay.metrics.shotZone} ${formatDecimal(bestReplay.metrics.epps)}`
      : synthetic.bestShot);
  const modelStatus =
    predictionSource === "ml_model"
      ? "ML active"
      : predictionSource === "rule_based_fallback"
        ? "Fallback ready"
        : "Engine ready";

  return {
    averageEpps: formatDecimal(averageEpps),
    averageMakeProbability: formatPercent(averageMakeProbability),
    cards: [
      {
        icon: Activity,
        label: "Total Simulations",
        tone: "neutral",
        value: `${totalSimulations}`,
      },
      {
        icon: Gauge,
        label: "Average EPPS",
        tone: "green",
        value: formatDecimal(averageEpps),
      },
      {
        icon: Percent,
        label: "Average Make Probability",
        tone: "orange",
        value: formatPercent(averageMakeProbability),
      },
      {
        icon: Trophy,
        label: "Best Shot",
        tone: "neutral",
        value: bestShot,
      },
      {
        icon: Award,
        label: "Average Mechanics Score",
        tone: "green",
        value: `${Math.round(averageMechanicsScore)}`,
      },
      {
        icon: BrainCircuit,
        label: "Current Model Status",
        tone: "orange",
        value: modelStatus,
      },
    ] satisfies DashboardStat[],
    totalSimulations,
  };
}

function buildTrendRows(
  replayHistory: ReturnType<typeof useShotStore.getState>["replayHistory"],
  epps: number,
  makeProbability: number,
): TrendRow[] {
  if (replayHistory.length) {
    return replayHistory
      .slice(0, 8)
      .reverse()
      .map((replay, index) => ({
        epps: Number(replay.metrics.epps.toFixed(2)),
        makeProbability: Number(replay.metrics.makeProbability.toFixed(2)),
        name: `S${index + 1}`,
      }));
  }

  // Synthetic trend rows provide a realistic first-run dashboard.
  return [
    { epps: 0.94, makeProbability: 0.39, name: "S1" },
    { epps: 1.05, makeProbability: 0.43, name: "S2" },
    { epps: 1.14, makeProbability: 0.46, name: "S3" },
    { epps: epps || 1.22, makeProbability: makeProbability || 0.49, name: "S4" },
    { epps: 1.31, makeProbability: 0.52, name: "S5" },
  ];
}

function buildZoneRows(
  replayHistory: ReturnType<typeof useShotStore.getState>["replayHistory"],
): ZoneRow[] {
  if (!replayHistory.length) {
    return [
      { attempts: 34, fill: "#86efac", zone: "Paint" },
      { attempts: 41, fill: "#fb923c", zone: "Mid" },
      { attempts: 53, fill: "#60a5fa", zone: "Three" },
    ];
  }

  const counts = replayHistory.reduce<Record<string, number>>((totals, replay) => {
    const zone = replay.metrics.shotZone.replace("-Range", "");
    totals[zone] = (totals[zone] ?? 0) + 1;
    return totals;
  }, {});

  return Object.entries(counts).map(([zone, attempts], index) => ({
    attempts,
    fill: ["#86efac", "#fb923c", "#60a5fa"][index % 3],
    zone,
  }));
}

function buildActivityRows(
  replayHistory: ReturnType<typeof useShotStore.getState>["replayHistory"],
): ActivityRow[] {
  if (replayHistory.length) {
    return replayHistory.slice(0, 4).map((replay) => ({
      description: `${replay.metrics.shotZone} saved with ${formatDecimal(replay.metrics.epps)} EPPS.`,
      label: replay.label,
      status: replay.metrics.epps >= 1 ? "green" : "orange",
    }));
  }

  return [
    {
      description: "Dashboard initialized with phase-6 synthetic product data.",
      label: "Session ready",
      status: "green",
    },
    {
      description: "Optimizer recommendation queue prepared for review.",
      label: "Optimizer synced",
      status: "orange",
    },
    {
      description: "Prediction engine health check completed successfully.",
      label: "Model checked",
      status: "green",
    },
  ];
}

function buildRecentSimulationRows(
  replayHistory: ReturnType<typeof useShotStore.getState>["replayHistory"],
): RecentSimulationRow[] {
  if (replayHistory.length) {
    return replayHistory.slice(0, 5).map((replay, index) => ({
      epps: formatDecimal(replay.metrics.epps),
      makeProbability: formatPercent(replay.metrics.makeProbability),
      mechanics: `${Math.round(replay.mechanicsScore.overallForm)}`,
      pressure: replay.metrics.pressureLevel,
      shot: replay.label || `Shot ${index + 1}`,
      zone: replay.metrics.shotZone,
    }));
  }

  return [
    {
      epps: "1.31",
      makeProbability: "52%",
      mechanics: "88",
      pressure: "Open",
      shot: "Corner lift",
      zone: "Three Point",
    },
    {
      epps: "1.18",
      makeProbability: "59%",
      mechanics: "83",
      pressure: "Tight",
      shot: "Elbow pull-up",
      zone: "Mid-Range",
    },
    {
      epps: "1.06",
      makeProbability: "53%",
      mechanics: "81",
      pressure: "Very Open",
      shot: "Paint touch",
      zone: "Paint",
    },
  ];
}

function buildRecommendationRows(optimizedShotTitle?: string): RecommendationRow[] {
  return [
    {
      delta: "+0.18 EPPS",
      label: "Primary option",
      value: optimizedShotTitle ?? "Shift to right corner three",
    },
    {
      delta: "+7% make",
      label: "Mechanics cue",
      value: "Raise release window",
    },
    {
      delta: "-1 defender",
      label: "Spacing cue",
      value: "Use weak-side relocation",
    },
  ];
}

function buildCoachingRows(recommendation: string): CoachingRow[] {
  return [
    {
      label: "Current read",
      message: recommendation,
      tone: "green",
    },
    {
      label: "Mechanics",
      message: "Keep the release point above the contest and replay the simulator frame-by-frame.",
      tone: "orange",
    },
    {
      label: "Decision",
      message: "Prioritize open threes when pressure drops below tight coverage.",
      tone: "green",
    },
  ];
}

function average(values: number[]) {
  // Guard against empty arrays when a user has not created replay history yet.
  return values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;
}

function formatDecimal(value: number) {
  return value.toFixed(2);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
