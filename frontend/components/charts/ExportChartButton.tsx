"use client";

import { FileJson, Sheet } from "lucide-react";
import { showToast } from "@/components/layout/ToastViewport";
import { Button } from "@/components/ui";

type ExportChartButtonProps = {
  data: unknown;
  filename: string;
};

export function ExportChartButton({ data, filename }: ExportChartButtonProps) {
  const exportJson = () => {
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
    showToast("JSON export downloaded");
  };

  const exportCsv = () => {
    const rows = Array.isArray(data) ? data : [data];
    const normalizedRows = rows.filter(
      (row): row is Record<string, unknown> =>
        Boolean(row) && typeof row === "object" && !Array.isArray(row),
    );

    if (!normalizedRows.length) {
      exportJson();
      return;
    }

    const headers = Array.from(
      normalizedRows.reduce<Set<string>>((keys, row) => {
        Object.keys(row).forEach((key) => keys.add(key));
        return keys;
      }, new Set()),
    );
    const csv = [
      headers.join(","),
      ...normalizedRows.map((row) =>
        headers.map((header) => formatCsvCell(row[header])).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("CSV export downloaded");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={exportJson} variant="outline">
        <FileJson className="size-4" />
        JSON
      </Button>
      <Button type="button" onClick={exportCsv} variant="outline">
        <Sheet className="size-4" />
        CSV
      </Button>
    </div>
  );
}

function formatCsvCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const text =
    typeof value === "object" ? JSON.stringify(value) : String(value);

  return `"${text.replaceAll("\"", "\"\"")}"`;
}
