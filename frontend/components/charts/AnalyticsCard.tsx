import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui";

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
  // Shared analytics cards now delegate structure to the design system.
  return (
    <Card>
      <CardHeader action={action} eyebrow={eyebrow} title={title}>
        {description}
      </CardHeader>
      <div className="mt-4">{children}</div>
    </Card>
  );
}
