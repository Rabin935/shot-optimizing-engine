"use client";

import { useChartPalette } from '@/lib/chart-theme';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as ReLineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  BrainCircuit,
  Database,
  GitCompareArrows,
  Grid3X3,
  LineChart,
  ShieldCheck,
} from "lucide-react";
import { ChartContainer } from "@/components/charts";
import {
  Card,
  CardHeader,
  DataTable,
  Eyebrow,
  Heading,
  TableCell,
  TableHead,
  Text,
} from "@/components/ui";

const modelMetrics = [
  { label: "Accuracy", value: 0.6295387156531563 },
  { label: "Precision", value: 0.6588256952899779 },
  { label: "Recall", value: 0.3947464081486328 },
  { label: "F1 Score", value: 0.49369013466271616 },
  { label: "ROC AUC", value: 0.6539309495705381 },
  { label: "Log Loss", value: 0.641 },
];

const confusionMatrix = [
  { actual: "Miss", miss: 391375, make: 81541 },
  { actual: "Make", miss: 241429, make: 157460 },
];

const rocCurve = [
  { fpr: 0, tpr: 0 },
  { fpr: 0.08, tpr: 0.2 },
  { fpr: 0.18, tpr: 0.39 },
  { fpr: 0.32, tpr: 0.56 },
  { fpr: 0.48, tpr: 0.7 },
  { fpr: 0.68, tpr: 0.83 },
  { fpr: 0.86, tpr: 0.94 },
  { fpr: 1, tpr: 1 },
];

const precisionRecallCurve = [
  { precision: 0.71, recall: 0.08 },
  { precision: 0.69, recall: 0.16 },
  { precision: 0.67, recall: 0.28 },
  { precision: 0.66, recall: 0.39 },
  { precision: 0.62, recall: 0.52 },
  { precision: 0.58, recall: 0.68 },
  { precision: 0.53, recall: 0.82 },
  { precision: 0.46, recall: 1 },
];

const featureImportance = [
  { feature: "is_dunk", importance: 0.5529 },
  { feature: "distance_pressure_interaction", importance: 0.1576 },
  { feature: "shot_distance", importance: 0.0383 },
  { feature: "is_driving", importance: 0.0315 },
  { feature: "is_jump_shot", importance: 0.0279 },
  { feature: "is_pullup", importance: 0.0268 },
  { feature: "zone_paint", importance: 0.0193 },
  { feature: "is_hook", importance: 0.0171 },
];

const datasetSummary = [
  { label: "Training Samples", value: "3,487,218" },
  { label: "Validation Samples", value: "435,902" },
  { label: "Test Samples", value: "435,903" },
  { label: "Number of Features", value: "38" },
];

const crossValidation = [
  { fold: "Fold 1", accuracy: 0.626, auc: 0.648, f1: 0.489 },
  { fold: "Fold 2", accuracy: 0.631, auc: 0.655, f1: 0.496 },
  { fold: "Fold 3", accuracy: 0.628, auc: 0.652, f1: 0.492 },
  { fold: "Fold 4", accuracy: 0.633, auc: 0.659, f1: 0.501 },
  { fold: "Fold 5", accuracy: 0.63, auc: 0.654, f1: 0.494 },
];

const modelComparison = [
  {
    accuracy: 0.58,
    approach: "Rule-Based Engine",
    explanation: "Stable fallback with hand-authored pressure and distance rules.",
    f1: 0.42,
    rocAuc: 0.57,
  },
  {
    accuracy: 0.63,
    approach: "XGBoost Model",
    explanation: "Learns nonlinear feature interactions from historical shot data.",
    f1: 0.494,
    rocAuc: 0.654,
  },
];

export function MlEvaluationDashboard() {
  const palette = useChartPalette();
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6">
      <header className="border-b border-white/10 pb-6">
        <Eyebrow>Model Evaluation</Eyebrow>
        <Heading className="mt-3" level={1}>
          Machine learning performance dashboard
        </Heading>
        <Text className="mt-3 max-w-3xl text-base" muted>
          Technical validation metrics for the trained ShotOptix XGBoost model.
          This page is designed for research review and thesis presentation, not
          individual shot simulation.
        </Text>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {modelMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader
            eyebrow="Classification"
            icon={<Grid3X3 className="size-5" />}
            title="Confusion matrix"
          >
            Rows are actual labels. Columns are predicted labels.
          </CardHeader>
          <div className="grid gap-3">
            {confusionMatrix.map((row) => (
              <div
                key={row.actual}
                className="grid grid-cols-[92px_1fr_1fr] overflow-hidden rounded-lg border border-white/10 bg-panel-muted text-sm"
              >
                <div className="grid place-items-center border-r border-white/10 px-3 py-5 font-black text-white">
                  Actual {row.actual}
                </div>
                <MatrixCell label="Pred Miss" value={row.miss} />
                <MatrixCell label="Pred Make" value={row.make} hot={row.actual === "Make"} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Discrimination"
            icon={<LineChart className="size-5" />}
            title="ROC curve"
          >
            The ROC curve summarizes how well the model separates made shots
            from missed shots across thresholds.
          </CardHeader>
          <ChartContainer height={310} title="ROC curve">
            <ReLineChart data={rocCurve} margin={{ bottom: 8, left: -10, right: 18, top: 16 }}>
              <CartesianGrid stroke={palette.grid} strokeDasharray="4 4" />
              <XAxis dataKey="fpr" stroke={palette.axis} tickFormatter={formatAxis} />
              <YAxis stroke={palette.axis} tickFormatter={formatAxis} />
              <Tooltip content={<CurveTooltip xLabel="False positive rate" yLabel="True positive rate" />} />
              <Line dataKey="tpr" dot={{ fill: "#86efac", r: 3 }} stroke={palette.series2} strokeWidth={3} type="monotone" />
            </ReLineChart>
          </ChartContainer>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            eyebrow="Threshold Quality"
            icon={<ShieldCheck className="size-5" />}
            title="Precision-recall curve"
          />
          <ChartContainer height={300} title="Precision recall curve">
            <AreaChart data={precisionRecallCurve} margin={{ bottom: 8, left: -10, right: 18, top: 16 }}>
              <CartesianGrid stroke={palette.grid} strokeDasharray="4 4" />
              <XAxis dataKey="recall" stroke={palette.axis} tickFormatter={formatAxis} />
              <YAxis dataKey="precision" stroke={palette.axis} tickFormatter={formatAxis} />
              <Tooltip content={<CurveTooltip xLabel="Recall" yLabel="Precision" />} />
              <Area dataKey="precision" fill="#fb923c33" stroke={palette.series1} strokeWidth={3} type="monotone" />
            </AreaChart>
          </ChartContainer>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Explainability"
            icon={<BarChart3 className="size-5" />}
            title="Feature importance"
          />
          <ChartContainer height={300} title="Feature importance">
            <BarChart data={featureImportance} layout="vertical" margin={{ bottom: 8, left: 78, right: 18, top: 16 }}>
              <CartesianGrid stroke={palette.grid} strokeDasharray="4 4" />
              <XAxis stroke={palette.axis} type="number" tickFormatter={formatAxis} />
              <YAxis dataKey="feature" stroke={palette.axis} type="category" width={132} tick={{ fill: palette.axis, fontSize: 11, fontWeight: 700 }} />
              <Tooltip content={<ImportanceTooltip />} />
              <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
                {featureImportance.map((feature, index) => (
                  <Cell key={feature.feature} fill={index < 2 ? "#86efac" : "#fb923c"} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader
            eyebrow="Dataset"
            icon={<Database className="size-5" />}
            title="Dataset summary"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {datasetSummary.map((item) => (
              <SummaryTile key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Validation"
            icon={<BrainCircuit className="size-5" />}
            title="Cross validation results"
          />
          <DataTable aria-label="Cross validation results">
            <TableHead>
              <tr className="border-b border-white/10">
                <th className="py-2 pr-3">Fold</th>
                <th className="py-2 pr-3">Accuracy</th>
                <th className="py-2 pr-3">ROC AUC</th>
                <th className="py-2">F1</th>
              </tr>
            </TableHead>
            <tbody>
              {crossValidation.map((row) => (
                <tr key={row.fold}>
                  <TableCell className="font-black text-white">{row.fold}</TableCell>
                  <TableCell>{formatPercent(row.accuracy)}</TableCell>
                  <TableCell>{row.auc.toFixed(3)}</TableCell>
                  <TableCell>{row.f1.toFixed(3)}</TableCell>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
      </section>

      <Card>
        <CardHeader
          eyebrow="Baseline Comparison"
          icon={<GitCompareArrows className="size-5" />}
          title="Rule-based engine vs XGBoost model"
        >
          The trained model performs better because it learns nonlinear
          interactions between distance, pressure, zone, shot type, and timing
          instead of applying a fixed rule to every shot.
        </CardHeader>
        <div className="grid gap-4 lg:grid-cols-2">
          {modelComparison.map((model) => (
            <article
              key={model.approach}
              className="rounded-lg border border-white/10 bg-panel-muted p-4"
            >
              <Heading level={3}>{model.approach}</Heading>
              <Text className="mt-2" muted>
                {model.explanation}
              </Text>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <SummaryTile label="Accuracy" value={formatPercent(model.accuracy)} />
                <SummaryTile label="ROC AUC" value={model.rocAuc.toFixed(3)} />
                <SummaryTile label="F1 Score" value={model.f1.toFixed(3)} />
              </div>
            </article>
          ))}
        </div>
      </Card>
    </section>
  );
}

function MetricCard({
  metric,
}: {
  metric: {
    label: string;
    value: number;
  };
}) {
  return (
    <Card padding="sm" className="bg-panel-muted">
      <Eyebrow className="text-slate-500">{metric.label}</Eyebrow>
      <p className="mt-3 text-2xl font-black text-white">
        {metric.label === "Log Loss"
          ? metric.value.toFixed(3)
          : formatPercent(metric.value)}
      </p>
    </Card>
  );
}

function MatrixCell({
  hot = false,
  label,
  value,
}: {
  hot?: boolean;
  label: string;
  value: number;
}) {
  return (
    <div className={hot ? "bg-green-400/10 px-3 py-5" : "px-3 py-5"}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-black text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function CurveTooltip({
  active,
  payload,
  xLabel,
  yLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, number> }>;
  xLabel: string;
  yLabel: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0].payload;
  const xValue = row.fpr ?? row.recall ?? 0;
  const yValue = row.tpr ?? row.precision ?? 0;

  return (
    <div className="rounded-lg border border-white/10 bg-[#090909]/95 p-3 text-xs font-bold text-slate-200 shadow-2xl">
      <p>{xLabel}: {xValue.toFixed(2)}</p>
      <p className="mt-1">{yLabel}: {yValue.toFixed(2)}</p>
    </div>
  );
}

function ImportanceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { feature: string; importance: number } }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-[#090909]/95 p-3 text-xs font-bold text-slate-200 shadow-2xl">
      <p className="text-white">{row.feature}</p>
      <p className="mt-1">Importance: {row.importance.toFixed(4)}</p>
    </div>
  );
}

function formatAxis(value: number | string) {
  return Number(value).toFixed(2);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}
