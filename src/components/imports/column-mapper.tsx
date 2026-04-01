"use client";

import { useState } from "react";
import { FieldRole } from "@prisma/client";
import type { ColumnTypeSuggestion } from "@/lib/csv/parser";
import type { MappingEntry } from "@/features/imports/actions";

const FIELD_ROLE_OPTIONS: { value: FieldRole; label: string }[] = [
  { value: "kpi", label: "KPI" },
  { value: "evidence", label: "Evidence" },
  { value: "takeaway", label: "Takeaway" },
  { value: "highlightFlag", label: "Highlight / Flag" },
  { value: "classification", label: "Classification" },
  { value: "dimension", label: "Dimension" },
  { value: "metric", label: "Metric" },
  { value: "note", label: "Note" },
  { value: "ignored", label: "Ignored" },
];

const TYPE_BADGE_COLORS: Record<string, string> = {
  number: "bg-blue-900/50 text-blue-200",
  percent: "bg-purple-900/50 text-purple-200",
  currency: "bg-green-900/50 text-green-200",
  text: "bg-slate-700/50 text-slate-300",
  date: "bg-yellow-900/50 text-yellow-200",
  status: "bg-orange-900/50 text-orange-200",
  tag: "bg-pink-900/50 text-pink-200",
  link: "bg-cyan-900/50 text-cyan-200",
  boolean: "bg-teal-900/50 text-teal-200",
};

type ColumnMapperProps = {
  suggestions: ColumnTypeSuggestion[];
  onSave: (mappings: MappingEntry[]) => void;
  loading: boolean;
};

export function ColumnMapper({ suggestions, onSave, loading }: ColumnMapperProps) {
  const [mappings, setMappings] = useState<MappingEntry[]>(
    suggestions.map((s) => ({
      sourceColumnName: s.columnName,
      displayLabel: s.columnName,
      fieldType: s.suggestedType,
      fieldRole: "metric" as FieldRole,
      widgetEligible: true,
    })),
  );

  function updateMapping(index: number, patch: Partial<MappingEntry>) {
    setMappings((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  function handleSave() {
    onSave(mappings);
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[1.4rem] border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-white/55">
            <tr>
              <th className="px-4 py-3 font-medium">Column</th>
              <th className="px-4 py-3 font-medium">Detected type</th>
              <th className="px-4 py-3 font-medium">Sample values</th>
              <th className="px-4 py-3 font-medium">Display label</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium text-center">Widget</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-950/55 text-slate-200">
            {suggestions.map((s, i) => {
              const m = mappings[i];
              if (!m) return null;
              return (
                <tr key={s.columnName}>
                  {/* Column name */}
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">
                    {s.columnName}
                  </td>

                  {/* Type badge */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        TYPE_BADGE_COLORS[s.suggestedType] ?? "bg-slate-700/50 text-slate-300"
                      }`}
                    >
                      {s.suggestedType}
                      {s.confidence === "low" && (
                        <span className="opacity-60">(low)</span>
                      )}
                    </span>
                  </td>

                  {/* Sample values */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.sampleValues.map((v, vi) => (
                        <span
                          key={vi}
                          className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs text-slate-400"
                        >
                          {v || "—"}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Display label */}
                  <td className="px-4 py-3">
                    <input
                      value={m.displayLabel}
                      onChange={(e) => updateMapping(i, { displayLabel: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-2 py-1.5 text-xs text-white outline-none"
                    />
                  </td>

                  {/* Role selector */}
                  <td className="px-4 py-3">
                    <select
                      value={m.fieldRole}
                      onChange={(e) => updateMapping(i, { fieldRole: e.target.value as FieldRole })}
                      className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-2 py-1.5 text-xs text-white outline-none"
                    >
                      {FIELD_ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Widget eligible toggle */}
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={m.widgetEligible}
                      onChange={(e) => updateMapping(i, { widgetEligible: e.target.checked })}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Saving mappings…" : "Save field mappings"}
      </button>
    </div>
  );
}
