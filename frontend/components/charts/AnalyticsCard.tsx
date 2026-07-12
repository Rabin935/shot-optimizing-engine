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
      <Badge tone={chartTheme === "contrast" ? "warning" : "neutral"}>
        {chartTheme}
      </Badge>
      {action}
    </div>
  );

  // Shared analytics cards now delegate structure to the design system.
  return (
    <Card>
      <CardHeader action={combinedAction} eyebrow={eyebrow} title={title}>
        {description}
      </CardHeader>
      <div className="mt-4">{children}</div>
    </Card>
  );
}
