import {
  BarChart3,
  BrainCircuit,
  Database,
  FileText,
  Gauge,
  GitBranch,
  Layers3,
  Monitor,
  Network,
  Rocket,
  Server,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Badge,
  Card,
  CardHeader,
  Eyebrow,
  Heading,
  Text,
} from "@/components/ui";

const objectives = [
  "Estimate shot make probability from contextual basketball features.",
  "Convert probability and shot value into Expected Points Per Shot.",
  "Recommend higher-value alternatives using pressure, spacing, and shot zone.",
  "Visualize mechanics with a simple 2D simulator for coaching feedback.",
  "Package analytics and reports for thesis review and portfolio presentation.",
];

type IconItem = readonly [string, string, LucideIcon];

const features: IconItem[] = [
  ["Interactive Court Sandbox", "Create a shot with draggable shooter and defenders.", Target],
  ["Machine Learning Prediction", "Use XGBoost to estimate make probability.", BrainCircuit],
  ["EPPS Engine", "Translate probability into expected scoring value.", Gauge],
  ["Shot Optimizer", "Compare the current shot against better alternatives.", Trophy],
  ["2D Stickman Simulator", "Replay mechanics and defender contests.", Layers3],
  ["Analytics Dashboard", "Review trends, heatmaps, model metrics, and pressure.", BarChart3],
  ["Reports", "Summarize and export analysis for review.", FileText],
];

const workflow = [
  "Court Sandbox",
  "Prediction",
  "Optimizer",
  "Simulator",
  "Analytics",
  "Reports",
];

const architecture: IconItem[] = [
  ["Frontend", "Next.js workspace, charts, simulator, and shared state.", Monitor],
  ["Backend API", "FastAPI prediction endpoint and service layer.", Server],
  ["Machine Learning", "XGBoost classifier trained on normalized shot logs.", BrainCircuit],
  ["Prediction Engine", "Feature engineering, probability, EPPS, and recommendation logic.", Network],
  ["Database", "Processed CSV/model artifacts used as the current data layer.", Database],
];

const stack = [
  ["Frontend", "Next.js, React, Tailwind CSS, Recharts, Zustand"],
  ["Backend", "FastAPI, Pydantic, Python services"],
  ["Machine Learning", "XGBoost, Pandas, Scikit-learn"],
  ["Visualization", "Recharts, SVG court rendering, 2D stickman mechanics"],
];

const futureWork = [
  "Add player-specific shot profiles and lineup context.",
  "Persist sessions in a database instead of local browser state.",
  "Add authenticated user workspaces for saved experiments.",
  "Expand model explainability with SHAP-style feature contribution views.",
  "Connect real-time tracking data for richer defender and movement features.",
];

export function ProjectOverview() {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6">
      <header className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
        <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1fr_380px] xl:items-end">
          <div>
            <Eyebrow>Project Overview</Eyebrow>
            <Heading className="mt-3" level={1}>
              ShotOptix
            </Heading>
            <Text className="mt-4 max-w-3xl text-base" muted>
              ShotOptix is a basketball shot optimization engine built for
              thesis research and portfolio demonstration. It combines an
              interactive court, machine learning prediction, expected-points
              analysis, optimization, mechanics simulation, and reporting into
              one end-to-end decision workflow.
            </Text>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone="success">XGBoost ML</Badge>
              <Badge tone="primary">EPPS Engine</Badge>
              <Badge tone="secondary">Next.js + FastAPI</Badge>
            </div>
          </div>
          <Card padding="sm" className="bg-panel-muted">
            <Eyebrow className="text-slate-500">Version</Eyebrow>
            <p className="mt-2 text-2xl font-black text-white">Phase 6</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Product polish, ML documentation, and research-ready analytics.
            </p>
          </Card>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader
            eyebrow="Research"
            icon={<Rocket className="size-5" />}
            title="Project introduction"
          />
          <Text muted>
            The project was built to answer a practical basketball question:
            given shot location, defender pressure, shot value, and context,
            should a player take the current shot or search for a better one?
            ShotOptix turns that question into a measurable prediction and
            recommendation workflow.
          </Text>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Problem"
            icon={<Target className="size-5" />}
            title="Problem statement"
          />
          <Text muted>
            Basketball decisions are often evaluated after the fact using box
            score outcomes, but the better research target is shot quality at
            the moment of release. ShotOptix models that moment by estimating
            make probability, expected points, defender pressure, and practical
            alternatives before the shot result is known.
          </Text>
        </Card>
      </section>

      <Card>
        <CardHeader
          eyebrow="Goals"
          icon={<GitBranch className="size-5" />}
          title="Objectives"
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {objectives.map((objective, index) => (
            <article
              key={objective}
              className="rounded-lg border border-white/10 bg-panel-muted p-4"
            >
              <span className="text-xs font-black text-orange-200">
                Objective {index + 1}
              </span>
              <p className="mt-3 text-sm font-bold leading-6 text-slate-200">
                {objective}
              </p>
            </article>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          eyebrow="Product Surface"
          icon={<Layers3 className="size-5" />}
          title="Key features"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map(([title, description, Icon]) => (
            <article
              key={title as string}
              className="rounded-lg border border-white/10 bg-panel-muted p-4"
            >
              <span className="grid size-10 place-items-center rounded-lg border border-green-300/25 bg-green-400/10 text-green-100">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-black text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {description}
              </p>
            </article>
          ))}
        </div>
      </Card>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            eyebrow="Workflow"
            icon={<GitBranch className="size-5" />}
            title="System workflow"
          />
          <FlowList items={workflow} />
        </Card>

        <Card>
          <CardHeader
            eyebrow="Architecture"
            icon={<Network className="size-5" />}
            title="System architecture diagram"
          />
          <div className="grid gap-3">
            {architecture.map(([title, description, Icon], index) => (
              <article
                key={title as string}
                className="relative rounded-lg border border-white/10 bg-panel-muted p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-orange-300/25 bg-orange-500/10 text-orange-100">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-white">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {description}
                    </p>
                  </div>
                </div>
                {index < architecture.length - 1 ? (
                  <div className="mx-auto mt-3 h-5 w-px bg-white/15" />
                ) : null}
              </article>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader
            eyebrow="Implementation"
            icon={<CodeIcon />}
            title="Technology stack"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {stack.map(([area, tools]) => (
              <div
                key={area}
                className="rounded-lg border border-white/10 bg-panel-muted p-4"
              >
                <p className="text-sm font-black text-white">{area}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{tools}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Data"
            icon={<Database className="size-5" />}
            title="Dataset information"
          />
          <div className="grid gap-3">
            <InfoRow label="Dataset" value="shotoptix_ml_training.csv" />
            <InfoRow label="Records" value="4,359,023" />
            <InfoRow label="Features" value="38 model features" />
            <InfoRow label="Target" value="shot_made" />
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader
            eyebrow="Roadmap"
            icon={<Rocket className="size-5" />}
            title="Future improvements"
          />
          <div className="grid gap-3">
            {futureWork.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/10 bg-panel-muted px-4 py-3 text-sm font-bold leading-6 text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Credits"
            icon={<Users className="size-5" />}
            title="Project credits"
          />
          <div className="grid gap-3">
            <InfoRow label="Developer" value="Rabin" />
            <InfoRow label="Supervisor" value="To be assigned" />
            <InfoRow label="Institution" value="Institution placeholder" />
            <InfoRow label="Project Version" value="Phase 6" />
            <InfoRow label="Runtime" value="Next.js 16.2.4" />
          </div>
        </Card>
      </section>
    </section>
  );
}

function FlowList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <div key={item}>
          <div className="rounded-lg border border-white/10 bg-panel-muted p-4">
            <span className="text-xs font-black text-green-200">
              Step {index + 1}
            </span>
            <p className="mt-2 text-base font-black text-white">{item}</p>
          </div>
          {index < items.length - 1 ? (
            <div className="mx-auto h-5 w-px bg-white/15" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-white/10 bg-panel-muted px-3 py-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span className="text-right text-sm font-black text-white">{value}</span>
    </div>
  );
}

function CodeIcon() {
  return <Server className="size-5" />;
}
