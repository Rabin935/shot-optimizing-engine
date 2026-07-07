"use client";

import { Download } from "lucide-react";

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
    <button
      type="button"
      onClick={exportData}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm font-black text-slate-100 transition hover:border-orange-300/35 hover:bg-orange-500/15"
    >
      <Download className="size-4" />
      Export
    </button>
  );
}
