"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import Papa from "papaparse";
import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { SurfaceCard } from "@/components/ui/surface-card";

type FormValues = {
  section: string;
  cadence: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  notes: string;
};

type ImportWorkspaceProps = {
  sections: ReadonlyArray<{ label: string; value: string }>;
  cadences: ReadonlyArray<{ label: string; value: string }>;
  suggestedMappings: Array<{ source: string; role: string; note: string }>;
};

type ParsedPreview = {
  fileName: string;
  columns: string[];
  rows: Array<Record<string, string>>;
};

export function ImportWorkspace({
  sections,
  cadences,
  suggestedMappings,
}: ImportWorkspaceProps) {
  const { control, register } = useForm<FormValues>({
    defaultValues: {
      section: sections[0]?.value ?? "academy",
      cadence: cadences[0]?.value ?? "weekly",
      periodLabel: "Q1 2026",
      periodStart: "2026-01-01",
      periodEnd: "2026-03-31",
      notes: "",
    },
  });
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const sectionValue = useWatch({ control, name: "section" }) ?? sections[0]?.value ?? "academy";
  const cadenceValue = useWatch({ control, name: "cadence" }) ?? cadences[0]?.value ?? "weekly";

  const uploadSummary = `${sectionValue.replace("-", " ")} · ${cadenceValue} · ${
    preview ? `${preview.columns.length} detected columns` : "Awaiting upload"
  }`;

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setPreview(null);
      return;
    }

    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    const rows = parsed.data.slice(0, 5);
    const columns = parsed.meta.fields ?? Object.keys(rows[0] ?? {});
    setPreview({ fileName: file.name, columns, rows });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <SurfaceCard eyebrow="Primary CSV" title="Upload and period metadata">
        <FadeIn>
          <div className="space-y-5">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/20 bg-white/4 px-6 py-10 text-center transition hover:border-[var(--accent)] hover:bg-white/7">
              <UploadCloud className="h-8 w-8 text-[var(--accent)]" />
              <span className="mt-4 text-base font-semibold text-white">
                Drop a primary section CSV or browse files
              </span>
              <span className="mt-2 text-sm text-slate-300">
                The first pass parses the file client-side to preview detected columns and keep
                unmapped fields visible.
              </span>
              <input
                className="sr-only"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                <span>Section</span>
                <select
                  {...register("section")}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
                >
                  {sections.map((section) => (
                    <option key={section.value} value={section.value}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                <span>Cadence</span>
                <select
                  {...register("cadence")}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
                >
                  {cadences.map((cadence) => (
                    <option key={cadence.value} value={cadence.value}>
                      {cadence.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                <span>Period label</span>
                <input
                  {...register("periodLabel")}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-300">
                  <span>Start</span>
                  <input
                    type="date"
                    {...register("periodStart")}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-300">
                  <span>End</span>
                  <input
                    type="date"
                    {...register("periodEnd")}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
                  />
                </label>
              </div>
            </div>

            <label className="space-y-2 text-sm text-slate-300">
              <span>Import notes</span>
              <textarea
                rows={4}
                {...register("notes")}
                className="w-full rounded-[1.4rem] border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
              />
            </label>
          </div>
        </FadeIn>
      </SurfaceCard>

      <div className="space-y-6">
        <SurfaceCard eyebrow="Detected structure" title="Candidate fields remain visible">
          <div className="flex items-center gap-3 rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3">
            <FileSpreadsheet className="h-5 w-5 text-[var(--accent)]" />
            <div>
              <p className="text-sm font-semibold text-white">{preview?.fileName ?? "No CSV loaded yet"}</p>
              <p className="text-sm text-slate-300">{uploadSummary}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(preview?.columns ?? ["channel", "reach", "executive_takeaway", "risk_flag"]).map(
              (column) => (
                <span
                  key={column}
                  className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200"
                >
                  {column}
                </span>
              ),
            )}
          </div>

          {preview?.rows?.length ? (
            <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-white/5 text-white/55">
                  <tr>
                    {preview.columns.map((column) => (
                      <th key={column} className="px-4 py-3 font-medium">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-slate-950/55 text-slate-200">
                  {preview.rows.map((row, index) => (
                    <tr key={index}>
                      {preview.columns.map((column) => (
                        <td key={column} className="px-4 py-3">
                          {row[column] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </SurfaceCard>

        <SurfaceCard eyebrow="Suggested mappings" title="Prior mappings and registry roles">
          <div className="space-y-3">
            {suggestedMappings.map((mapping) => (
              <div
                key={mapping.source}
                className="flex flex-col gap-2 rounded-[1.3rem] border border-white/10 bg-slate-950/45 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{mapping.source}</p>
                  <p className="text-sm text-slate-300">{mapping.note}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-200">
                  {mapping.role}
                </span>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
