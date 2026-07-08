"use client";

import type { ReactNode } from "react";
import { Card, Eyebrow } from "@/components/ui";

type FilterBarProps = {
  children: ReactNode;
  title?: string;
};

export function FilterBar({ children, title = "Filters" }: FilterBarProps) {
  // FilterBar uses the design-system card shell for every analytics page.
  return (
    <Card padding="sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Eyebrow className="text-slate-400">{title}</Eyebrow>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
    </Card>
  );
}
