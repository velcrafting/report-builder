"use client";

import { Download } from "lucide-react";

// Instructional template — generic enough to work for any department/period.
// Column headers use friendly placeholder names so users understand the pattern.
// Widget type is intentionally omitted — that's configured in the report builder.
const TEMPLATE_HEADERS = [
  "Department",
  "Period",
  "KPI 1",
  "KPI 2",
  "KPI 3",
];

const TEMPLATE_ROWS = [
  // Row 1 — description / label row
  ["e.g. Academy", "e.g. Q1 2025", "Description 1", "Description 2", "Description 3"],
  // Row 2 — data row
  ["Academy", "Q1 2025", "Data 1", "Data 2", "Data 3"],
];

function downloadCsv(headers: string[], rows: string[][]) {
  const lines = [headers, ...rows].map((row) =>
    row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
  );
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function DownloadTemplateButton() {
  return (
    <button
      type="button"
      onClick={() => downloadCsv(TEMPLATE_HEADERS, TEMPLATE_ROWS)}
      className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
    >
      <Download className="h-4 w-4" />
      Download template
    </button>
  );
}
