"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  LineChart,
  Server,
  Shield,
  Target,
} from "lucide-react";
import {
  predictShot,
  type ShotPredictionRequest,
  type ShotPredictionResponse,
} from "@/lib/api/shotPrediction";
import { cx } from "@/lib/design-system";
import { useShotStore, type PredictionSource } from "@/store/useShotStore";
import {
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

type ApiStatus = "idle" | "loading" | "connected" | "offline";

type Influence = {
  detail: string;
  label: string;
  tone: "green" | "orange" | "red" | "neutral";
};

export function PredictionAnalysisWorkspace() {
  const shooter = useShotStore((state) => state.shooter);
  const defenders = useShotStore((state) => state.defenders);
  const shotDistance = useShotStore((state) => state.shotDistance);
  const shotAngle = useShotStore((state) => state.shotAngle);
  const shotZone = useShotStore((state) => state.shotZone);
  const shotValue = useShotStore((state) => state.shotValue);
  const closestDefenderDistance = useShotStore(
    (state) => state.closestDefenderDistance,
  );
  const pressureLevel = useShotStore((state) => state.pressureLevel);
  const makeProbability = useShotStore((state) => state.makeProbability);
  const epps = useShotStore((state) => state.epps);
  const shotQuality = useShotStore((state) => state.shotQuality);
  const recommendation = useShotStore((state) => state.recommendation);
  const confidence = useShotStore((state) => state.confidence);
  const predictionSource = useShotStore((state) => state.predictionSource);
  const replayHistory = useShotStore((state) => state.replayHistory);
  const updatePredictionResult = useShotStore(
    (state) => state.updatePredictionResult,
  );
  const [apiStatus, setApiStatus] = useState<ApiStatus>("idle");
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [lastPredictionTime, setLastPredictionTime] = useState<string | null>(
    null,
  );

  const request = useMemo(
    () =>
      buildPredictionRequest({
        closestDefenderDistance,
        defenders,
        pressureLevel,
        shooter,
        shotAngle,
        shotDistance,
        shotValue,
        shotZone,
      }),
    [
      closestDefenderDistance,
      defenders,
      pressureLevel,
      shooter,
      shotAngle,
      shotDistance,
      shotValue,
      shotZone,
    ],
  );
  const requestKey = useMemo(() => JSON.stringify(request), [request]);

  useEffect(() => {
    const controller = new AbortController();
    const startedAt = performance.now();
    const loadingTimer = window.setTimeout(() => setApiStatus("loading"), 0);

    predictShot(request, { signal: controller.signal })
      .then((prediction) => {
        const elapsed = Math.round(performance.now() - startedAt);

        setApiStatus("connected");
        setResponseTime(elapsed);
        setLastPredictionTime(new Date().toISOString());
        updatePredictionResult(
          {
            confidence: prediction.confidence,
            epps: prediction.epps,
            makeProbability: prediction.make_probability,
            predictionSource: normalizePredictionSource(
              prediction.prediction_source,
            ),
            recommendation: prediction.recommendation,
            shotQuality: normalizeShotQuality(prediction.shot_quality),
          },
          "backend",
        );
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        setApiStatus("offline");
        setResponseTime(null);
        setLastPredictionTime(new Date().toISOString());
        console.warn("Prediction API unavailable", error);
      });

    return () => {
      window.clearTimeout(loadingTimer);
      controller.abort();
    };
  }, [request, requestKey, updatePredictionResult]);

  const influences = useMemo(
    () =>
      buildInfluences({
        closestDefenderDistance,
        pressureLevel,
        shotAngle,
        shotDistance,
        shotValue,
        shotZone,
      }),
    [
      closestDefenderDistance,
      pressureLevel,
      shotAngle,
      shotDistance,
      shotValue,
      shotZone,
    ],
  );
  const timelineRows = useMemo(
    () =>
      buildTimelineRows({
        current: {
          confidence,
          epps,
          makeProbability,
          predictionSource,
          shotQuality,
          shotZone,
        },
        replayHistory,
      }),
    [confidence, epps, makeProbability, predictionSource, replayHistory, shotQuality, shotZone],
  );

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6">
      <header className="grid gap-4 border-b border-white/10 pb-6 lg:grid-cols-[1fr_340px] lg:items-end">
        <div>
          <Eyebrow>ML Prediction</Eyebrow>
          <Heading className="mt-3" level={1}>
            Prediction analysis
          </Heading>
          <Text className="mt-3 max-w-3xl text-base" muted>
            Review what the trained XGBoost model predicts for the current shot
            selected in Court Sandbox. This page is read-only and focused on
            model output, feature values, and prediction transparency.
          </Text>
        </div>
        <Card padding="sm" className="bg-panel-muted">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Eyebrow className="text-slate-500">Current Shot</Eyebrow>
              <p className="mt-2 text-lg font-black text-white">{shotZone}</p>
            </div>
            <StatusChip tone={apiStatus === "connected" ? "success" : apiStatus === "offline" ? "danger" : "warning"}>
              {formatApiStatus(apiStatus)}
            </StatusChip>
          </div>
        </Card>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          icon={<Target className="size-5" />}
          label="Make Probability"
          tone="orange"
          value={formatPercent(makeProbability)}
        />
        <MetricCard
          icon={<Gauge className="size-5" />}
          label="Expected Points Per Shot"
          tone="green"
          value={formatDecimal(epps)}
        />
        <MetricCard
          icon={<CheckCircle2 className="size-5" />}
          label="Shot Quality"
          tone={qualityTone(shotQuality)}
          value={shotQuality}
        />
        <MetricCard
          icon={<BrainCircuit className="size-5" />}
          label="Confidence Score"
          tone="neutral"
          value={confidence}
        />
        <MetricCard
          icon={<Server className="size-5" />}
          label="Prediction Source"
          tone={predictionSource === "ml_model" ? "green" : "orange"}
          value={formatPredictionSource(predictionSource)}
        />
        <Card padding="sm" className="bg-panel-muted">
          <Eyebrow className="text-slate-500">Recommendation</Eyebrow>
          <p className="mt-3 text-sm font-bold leading-6 text-white">
            {recommendation}
          </p>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader
            eyebrow="Model Inputs"
            icon={<Activity className="size-5" />}
            title="Feature values used by the model"
          >
            The values below are read from shared application state after the
            shot is created in Court Sandbox.
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <FeatureRow label="Shot Distance" value={`${formatDecimal(shotDistance)} ft`} />
            <FeatureRow label="Shot Angle" value={`${formatDecimal(shotAngle)} deg`} />
            <FeatureRow label="Shot Zone" value={shotZone} />
            <FeatureRow label="Shot Value" value={`${shotValue} points`} />
            <FeatureRow
              label="Closest Defender Distance"
              value={Number.isFinite(closestDefenderDistance) ? `${formatDecimal(closestDefenderDistance)} ft` : "No defender"}
            />
            <FeatureRow label="Defender Pressure" value={pressureLevel} />
            <FeatureRow label="Shooter X" value={`${formatDecimal(shooter.x)} ft`} />
            <FeatureRow label="Shooter Y" value={`${formatDecimal(shooter.y)} ft`} />
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Explainability"
            icon={<BrainCircuit className="size-5" />}
            title="Why this prediction happened"
          >
            A lightweight explanation layer highlights the strongest basketball
            factors behind the model output.
          </CardHeader>
          <div className="grid gap-3">
            {influences.map((influence) => (
              <InfluenceCard key={influence.label} influence={influence} />
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader
            eyebrow="Session History"
            icon={<LineChart className="size-5" />}
            title="Prediction timeline"
          >
            Previous predictions from this session appear after simulator
            replays are saved.
          </CardHeader>
          <DataTable aria-label="Prediction timeline">
            <TableHead>
              <tr className="border-b border-white/10">
                <th className="py-2 pr-3">Shot</th>
                <th className="py-2 pr-3">Zone</th>
                <th className="py-2 pr-3">Make</th>
                <th className="py-2 pr-3">EPPS</th>
                <th className="py-2 pr-3">Quality</th>
                <th className="py-2 pr-3">Source</th>
                <th className="py-2">Confidence</th>
              </tr>
            </TableHead>
            <tbody>
              {timelineRows.map((row) => (
                <tr key={row.id}>
                  <TableCell className="font-black text-white">{row.label}</TableCell>
                  <TableCell>{row.zone}</TableCell>
                  <TableCell className="font-black text-orange-100">{row.make}</TableCell>
                  <TableCell className="font-black text-green-100">{row.epps}</TableCell>
                  <TableCell>{row.quality}</TableCell>
                  <TableCell>{row.source}</TableCell>
                  <TableCell>{row.confidence}</TableCell>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>

        <Card>
          <CardHeader
            eyebrow="API"
            icon={<Server className="size-5" />}
            title="Status card"
          />
          <div className="grid gap-3">
            <ApiRow label="Backend Status" value={formatApiStatus(apiStatus)} />
            <ApiRow
              label="Model Loaded"
              value={
                predictionSource === "ml_model"
                  ? "XGBoost active"
                  : apiStatus === "offline"
                    ? "Unknown"
                    : "Fallback available"
              }
            />
            <ApiRow
              label="Response Time"
              value={responseTime === null ? "Pending" : `${responseTime} ms`}
            />
            <ApiRow
              label="Last Prediction"
              value={lastPredictionTime ? formatDateTime(lastPredictionTime) : "Waiting"}
            />
          </div>
        </Card>
      </section>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  tone,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "green" | "orange" | "red" | "neutral";
  value: string;
}) {
  const toneClass = metricTones[tone];

  return (
    <Card padding="sm" className={cx("min-h-32", toneClass)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow className="text-current/70">{label}</Eyebrow>
          <p className="mt-4 text-2xl font-black text-white">{value}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-current/25 bg-black/20">
          {icon}
        </span>
      </div>
    </Card>
  );
}

function FeatureRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-panel-muted px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function InfluenceCard({ influence }: { influence: Influence }) {
  return (
    <article className={cx("rounded-lg border p-4", metricTones[influence.tone])}>
      <div className="flex items-start gap-3">
        <Shield className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="text-sm font-black text-white">{influence.label}</p>
          <p className="mt-1 text-sm leading-6 text-current/80">
            {influence.detail}
          </p>
        </div>
      </div>
    </article>
  );
}

function ApiRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-white/10 bg-panel-muted px-3 py-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span className="text-right text-sm font-black text-white">{value}</span>
    </div>
  );
}

function buildPredictionRequest({
  closestDefenderDistance,
  defenders,
  pressureLevel,
  shooter,
  shotAngle,
  shotDistance,
  shotValue,
  shotZone,
}: {
  closestDefenderDistance: number;
  defenders: Array<{ id: string; x: number; y: number }>;
  pressureLevel: string;
  shooter: { x: number; y: number };
  shotAngle: number;
  shotDistance: number;
  shotValue: 2 | 3;
  shotZone: string;
}): ShotPredictionRequest {
  const closestDefender = defenders.reduce<(typeof defenders)[number] | null>(
    (closest, defender) => {
      if (!closest) {
        return defender;
      }

      return distance(shooter, defender) < distance(shooter, closest)
        ? defender
        : closest;
    },
    null,
  );
  const defenderDistance = Number.isFinite(closestDefenderDistance)
    ? closestDefenderDistance
    : closestDefender
      ? distance(shooter, closestDefender)
      : 99;

  return {
    defender_distance: round(defenderDistance),
    defender_x: round(closestDefender?.x ?? shooter.x),
    defender_y: round(closestDefender?.y ?? shooter.y),
    dribbles: 1,
    period: 4,
    pressure_level: pressureLevel,
    shot_angle: round(shotAngle),
    shot_clock: 12,
    shot_distance: round(shotDistance),
    shot_value: shotValue,
    shot_zone: shotZone,
    shooter_x: round(shooter.x),
    shooter_y: round(shooter.y),
    touch_time: 2.5,
  };
}

function buildInfluences({
  closestDefenderDistance,
  pressureLevel,
  shotAngle,
  shotDistance,
  shotValue,
  shotZone,
}: {
  closestDefenderDistance: number;
  pressureLevel: string;
  shotAngle: number;
  shotDistance: number;
  shotValue: 2 | 3;
  shotZone: string;
}): Influence[] {
  const influences: Influence[] = [];

  if (closestDefenderDistance <= 4 || pressureLevel.includes("Tight")) {
    influences.push({
      detail: "Close defender pressure reduced the expected make probability.",
      label: "Defender pressure",
      tone: "red",
    });
  } else {
    influences.push({
      detail: "Open spacing gives the shooter a cleaner release window.",
      label: "Defender spacing",
      tone: "green",
    });
  }

  if (shotValue === 3) {
    influences.push({
      detail: "A three-point attempt increases shot value and can raise EPPS even when make probability is lower.",
      label: "Shot value",
      tone: "green",
    });
  } else {
    influences.push({
      detail: "A two-point attempt needs a stronger make probability to match high-value perimeter looks.",
      label: "Shot value",
      tone: "orange",
    });
  }

  if (shotDistance > 25) {
    influences.push({
      detail: "Long distance lowers raw make probability compared with paint and mid-range attempts.",
      label: "Shot distance",
      tone: "orange",
    });
  } else if (shotZone === "Paint") {
    influences.push({
      detail: "Paint proximity raises make probability and helps stabilize the prediction.",
      label: "Shot distance",
      tone: "green",
    });
  }

  influences.push({
    detail:
      shotAngle < 35
        ? "A corner-style angle can improve spacing and raise expected value."
        : "The release angle is treated as contextual geometry for the shot path.",
    label: "Shot angle",
    tone: shotAngle < 35 ? "green" : "neutral",
  });

  return influences.slice(0, 4);
}

function buildTimelineRows({
  current,
  replayHistory,
}: {
  current: {
    confidence: string;
    epps: number;
    makeProbability: number;
    predictionSource: PredictionSource;
    shotQuality: string;
    shotZone: string;
  };
  replayHistory: ReturnType<typeof useShotStore.getState>["replayHistory"];
}) {
  return [
    {
      confidence: current.confidence,
      epps: formatDecimal(current.epps),
      id: "current",
      label: "Current shot",
      make: formatPercent(current.makeProbability),
      quality: current.shotQuality,
      source: formatPredictionSource(current.predictionSource),
      zone: current.shotZone,
    },
    ...replayHistory.slice(0, 7).map((replay, index) => ({
      confidence: replay.metrics.confidence,
      epps: formatDecimal(replay.metrics.epps),
      id: replay.id,
      label: replay.label || `Prediction ${index + 1}`,
      make: formatPercent(replay.metrics.makeProbability),
      quality: replay.metrics.shotQuality,
      source: formatPredictionSource(replay.metrics.predictionSource),
      zone: replay.metrics.shotZone,
    })),
  ];
}

function normalizePredictionSource(
  source: ShotPredictionResponse["prediction_source"],
): PredictionSource {
  return source === "ml_model" || source === "rule_based_fallback"
    ? source
    : "prediction_engine";
}

function normalizeShotQuality(quality: string | undefined) {
  if (
    quality === "Excellent" ||
    quality === "Good" ||
    quality === "Average" ||
    quality === "Poor" ||
    quality === "Bad"
  ) {
    return quality;
  }

  return "Average";
}

function qualityTone(quality: string) {
  if (quality === "Excellent" || quality === "Good") {
    return "green";
  }

  if (quality === "Poor" || quality === "Bad") {
    return "red";
  }

  return "orange";
}

function formatPredictionSource(source: PredictionSource) {
  const labels: Record<PredictionSource, string> = {
    local_estimate: "Local estimate",
    ml_model: "ML Model",
    prediction_engine: "Prediction engine",
    rule_based_fallback: "Rule-Based Fallback",
  };

  return labels[source];
}

function formatApiStatus(status: ApiStatus) {
  const labels: Record<ApiStatus, string> = {
    connected: "Backend connected",
    idle: "Waiting",
    loading: "Checking backend",
    offline: "Backend offline",
  };

  return labels[status];
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function distance(
  first: { x: number; y: number },
  second: { x: number; y: number },
) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function formatDecimal(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function formatPercent(value: number) {
  return `${Math.round((Number.isFinite(value) ? value : 0) * 100)}%`;
}

const metricTones = {
  green: "border-green-300/25 bg-green-400/10 text-green-100",
  neutral: "border-white/10 bg-panel-muted text-slate-200",
  orange: "border-orange-300/25 bg-orange-500/10 text-orange-100",
  red: "border-red-300/25 bg-red-500/10 text-red-100",
};
