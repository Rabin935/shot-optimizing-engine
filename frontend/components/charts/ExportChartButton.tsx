"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui";

type ExportChartButtonProps = {
  data: unknown;
  filename: string;
};

export function ExportChartButton({ data, filename }: ExportChartButtonProps) {
  const exportData = () => {
    // Export the transformed chart data so reports can cite the exact dataset.
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      type="button"
      onClick={exportData}
      variant="outline"
    >
      <Download className="size-4" />
      Export
    </Button>
  );
}
