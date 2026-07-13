import {
  BrainCircuit,
  Code2,
  Database,
  GitBranch,
  ListChecks,
  Network,
  Server,
  Settings2,
} from "lucide-react";
import {
  Badge,
  Card,
  CardHeader,
  DataTable,
  Eyebrow,
  Heading,
  TableCell,
  TableHead,
  Text,
} from "@/components/ui";

const modelOverview = [
  ["Algorithm", "XGBoost XGBClassifier"],
  ["Version", "shot_xgboost_model"],
  ["Training Date", "2026-07-03"],
  ["Current Status", "Production-ready with fallback"],
];

const pipeline = [
  "Court Sandbox",
  "Feature Engineering",
  "XGBoost Prediction",
  "EPPS Calculation",
  "Recommendation",
];

const datasetInfo = [
  ["Dataset Name", "shotoptix_ml_training.csv"],
  ["Number of Records", "4,359,023"],
  ["Number of Features", "38"],
  ["Train/Test Split", "80% / 20%"],
];

const hyperparameters = [
  ["n_estimators", "200"],
  ["max_depth", "4"],
  ["learning_rate", "0.1"],
  ["subsample", "0.8"],
  ["colsample_bytree", "0.8"],
  ["eval_metric", "logloss"],
];

const featureImportance: Array<[string, number]> = [
  ["is_dunk", 0.5529],
  ["distance_pressure_interaction", 0.1576],
  ["shot_distance", 0.0383],
  ["is_driving", 0.0315],
  ["is_jump_shot", 0.0279],
  ["is_pullup", 0.0268],
  ["zone_paint", 0.0193],
  ["is_hook", 0.0171],
];

const features = [
  ["period", "Game period context for late-game and fatigue patterns."],
  ["shot_clock", "Remaining shot clock seconds at the time of the attempt."],
  ["dribbles", "Number of dribbles before the shot."],
  ["touch_time", "How long the shooter held the ball before release."],
  ["shot_distance", "Distance from shooter location to the basket."],
  ["shot_angle", "Court angle from shooter to rim."],
  ["defender_distance", "Distance from shooter to closest defender."],
  ["loc_x", "Shooter horizontal court coordinate."],
  ["loc_y", "Shooter vertical court coordinate."],
  ["abs_loc_x", "Absolute horizontal spacing from court center."],
  ["game_clock_seconds", "Game clock converted into seconds."],
  ["is_home", "Whether the shooter is on the home team."],
  ["shot_value", "Two-point or three-point attempt value."],
  ["distance_pressure_interaction", "Distance adjusted by defender pressure."],
  ["late_clock", "One-hot flag for late-clock attempts."],
  ["early_clock", "One-hot flag for early-clock attempts."],
  ["quick_touch", "One-hot flag for quick catch-and-shoot style attempts."],
  ["high_dribble", "One-hot flag for high-dribble attempts."],
  ["long_three", "One-hot flag for deep three-point attempts."],
  ["deep_two", "One-hot flag for long two-point attempts."],
  ["is_layup", "Action-type flag for layup attempts."],
  ["is_dunk", "Action-type flag for dunk attempts."],
  ["is_jump_shot", "Action-type flag for jump shots."],
  ["is_pullup", "Action-type flag for pull-up shots."],
  ["is_driving", "Action-type flag for driving attempts."],
  ["is_fadeaway", "Action-type flag for fadeaway attempts."],
  ["is_hook", "Action-type flag for hook shots."],
  ["is_tip", "Action-type flag for tip attempts."],
  ["position_guard", "Shooter position group encoded as guard."],
  ["position_forward", "Shooter position group encoded as forward."],
  ["position_center", "Shooter position group encoded as center."],
  ["zone_paint", "One-hot zone flag for paint attempts."],
  ["zone_mid_range", "One-hot zone flag for mid-range attempts."],
  ["zone_three_point", "One-hot zone flag for three-point attempts."],
  ["pressure_very_tight", "One-hot defender pressure flag."],
  ["pressure_tight", "One-hot defender pressure flag."],
  ["pressure_open", "One-hot defender pressure flag."],
  ["pressure_very_open", "One-hot defender pressure flag."],
];

const stack = [
  ["Next.js", "Frontend dashboard, routing, and interactive analytics UI."],
  ["FastAPI", "Backend prediction endpoint and model serving layer."],
  ["XGBoost", "Gradient-boosted classifier for made-shot probability."],
  ["Pandas", "Dataset cleaning, feature preparation, and evaluation tables."],
  ["Scikit-learn", "Train/test split, metrics, and validation utilities."],
];

export function ModelInfoDocumentation() {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6">
      <header className="grid gap-4 border-b border-white/10 pb-6 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <Eyebrow>AI System Documentation</Eyebrow>
          <Heading className="mt-3" level={1}>
            ShotOptix machine learning system
          </Heading>
          <Text className="mt-3 max-w-3xl text-base" muted>
            Technical documentation for how the ShotOptix XGBoost model turns
            court context into make probability, expected points, and coaching
            recommendations.
          </Text>
        </div>
        <Card padding="sm" className="bg-success-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Eyebrow className="text-green-200">Model Status</Eyebrow>
              <p className="mt-2 text-xl font-black text-white">Active</p>
            </div>
            <Badge tone="success">Fallback Ready</Badge>
          </div>
        </Card>
      </header>

      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <InfoCard
          icon={<BrainCircuit className="size-5" />}
          items={modelOverview}
          title="Model overview"
        />

        <Card>
          <CardHeader
            eyebrow="Pipeline"
            icon={<GitBranch className="size-5" />}
            title="Prediction pipeline"
          >
            The live app uses this flow whenever a shot is created or updated.
          </CardHeader>
          <div className="grid gap-3 md:grid-cols-5">
            {pipeline.map((step, index) => (
              <div
                key={step}
                className="relative rounded-lg border border-white/10 bg-panel-muted p-4"
              >
                <span className="text-xs font-black text-orange-200">
                  Step {index + 1}
                </span>
                <p className="mt-3 text-sm font-black text-white">{step}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader
          eyebrow="Feature Contract"
          icon={<ListChecks className="size-5" />}
          title="Features used by the model"
        >
          These features must be generated in the same order for training and
          inference.
        </CardHeader>
        <DataTable aria-label="Model features">
          <TableHead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-3">Feature</th>
              <th className="py-2">Explanation</th>
            </tr>
          </TableHead>
          <tbody>
            {features.map(([feature, description]) => (
              <tr key={feature}>
                <TableCell className="font-mono text-xs font-black text-green-100">
                  {feature}
                </TableCell>
                <TableCell>{description}</TableCell>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </Card>

      <section className="grid gap-5 xl:grid-cols-2">
        <InfoCard
          icon={<Database className="size-5" />}
          items={datasetInfo}
          title="Dataset information"
        />
        <InfoCard
          icon={<Settings2 className="size-5" />}
          items={hyperparameters}
          title="Model hyperparameters"
        />
      </section>

      <Card>
        <CardHeader
          eyebrow="Explainability"
          icon={<Network className="size-5" />}
          title="Feature importance"
        />
        <div className="grid gap-3">
          {featureImportance.map(([feature, importance]) => (
            <div key={feature} className="grid gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-mono font-black text-white">{feature}</span>
                <span className="font-black text-green-100">
                  {importance.toFixed(4)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-300 to-orange-300"
                  style={{ width: `${Math.max(4, importance * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader
            eyebrow="Backend API"
            icon={<Server className="size-5" />}
            title="Prediction endpoint"
          />
          <div className="grid gap-3">
            <CodeBlock title="Endpoint">
              POST /api/predict-shot
            </CodeBlock>
            <CodeBlock title="Request format">
{`{
  "shooter_x": 38,
  "shooter_y": 26,
  "defender_x": 33,
  "defender_y": 23,
  "shot_distance": 24.6,
  "shot_angle": 42,
  "shot_zone": "Three Point",
  "defender_distance": 5.8,
  "pressure_level": "Open",
  "shot_value": 3
}`}
            </CodeBlock>
            <CodeBlock title="Response format">
{`{
  "make_probability": 0.49,
  "make_probability_percent": "49.0%",
  "shot_value": 3,
  "epps": 1.47,
  "shot_quality": "Good",
  "recommendation": "Take the shot",
  "confidence": "High",
  "prediction_source": "ml_model"
}`}
            </CodeBlock>
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Implementation"
            icon={<Code2 className="size-5" />}
            title="Technology stack"
          />
          <div className="grid gap-3">
            {stack.map(([name, description]) => (
              <div
                key={name}
                className="rounded-lg border border-white/10 bg-panel-muted p-4"
              >
                <p className="text-sm font-black text-white">{name}</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </section>
  );
}

function InfoCard({
  icon,
  items,
  title,
}: {
  icon: React.ReactNode;
  items: string[][];
  title: string;
}) {
  return (
    <Card>
      <CardHeader eyebrow="Reference" icon={icon} title={title} />
      <div className="grid gap-3">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-white/10 bg-panel-muted px-3 py-2"
          >
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              {label}
            </span>
            <span className="text-right text-sm font-black text-white">
              {value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CodeBlock({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </p>
      <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/35 p-4 text-xs font-bold leading-6 text-slate-200">
        <code>{children}</code>
      </pre>
    </div>
  );
}
