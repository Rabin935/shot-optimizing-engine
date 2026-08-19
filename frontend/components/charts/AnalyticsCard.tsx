import type { ReactNode } from "react";
import { Badge, Card, CardHeader } from "@/components/ui";
import { useSettingsStore } from "@/store/useSettingsStore";

type AnalyticsCardProps = {
  action?: ReactNode;
  children: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function AnalyticsCard({
  action,
  children,
  description,
  eyebrow,
  title,
}: AnalyticsCardProps) {
  const chartTheme = useSettingsStore((state) => state.settings.chartTheme);
  const combinedAction = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Badge
        tone={
          chartTheme === "contrast"
            ? "warning"
            : chartTheme === "print"
              ? "secondary"
              : "neutral"
        }
      >
        {chartTheme}
      </Badge>
      {action}
    </div>
  );

  return (
    <Card data-chart-theme={chartTheme}>
      <CardHeader action={combinedAction} eyebrow={eyebrow} title={title}>
        {description}
      </CardHeader>
      <div className="mt-4" data-chart-theme={chartTheme}>
        {children}
      </div>
    </Card>
  );
}
