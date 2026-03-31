"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { ReportCreationPreset } from "@/features/reports/report-presets";

type CreateReportModalProps = {
  open: boolean;
  templates: Array<{ id: string; label: string }>;
  reportPresets: ReportCreationPreset[];
  onClose: () => void;
  onCreateFromTemplate: (templateId: string, newReportLabel: string) => void;
  onCreateFromPreset: (presetId: string, newReportLabel: string) => void;
  onCreateCustom: (newReportLabel: string) => void;
};

export function CreateReportModal({
  open,
  templates,
  reportPresets,
  onClose,
  onCreateFromTemplate,
  onCreateFromPreset,
  onCreateCustom,
}: CreateReportModalProps) {
  const [fromTemplateId, setFromTemplateId] = useState(templates[0]?.id ?? "");
  const [templateLabel, setTemplateLabel] = useState("New report from template");
  const [presetId, setPresetId] = useState(reportPresets[0]?.id ?? "");
  const [presetLabel, setPresetLabel] = useState("New report from preset");
  const [customLabel, setCustomLabel] = useState("Custom report");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
      <div className="w-full max-w-3xl rounded-[1.5rem] border border-white/15 bg-[var(--panel-strong)] px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Create new report</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/5 p-2 text-white/70 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <section className="rounded-[1rem] border border-white/10 bg-slate-950/45 px-4 py-4">
            <p className="text-sm font-semibold text-white">From template</p>
            <p className="mt-1 text-xs text-slate-300">Clone an existing template and continue editing.</p>
            <div className="mt-3 space-y-2">
              <select
                value={fromTemplateId}
                onChange={(event) => setFromTemplateId(event.target.value)}
                className="w-full rounded-[0.85rem] border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={templateLabel}
                onChange={(event) => setTemplateLabel(event.target.value)}
                className="w-full rounded-[0.85rem] border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
              />
              <button
                type="button"
                onClick={() => onCreateFromTemplate(fromTemplateId, templateLabel)}
                className="w-full rounded-[0.85rem] border border-[var(--accent)]/45 bg-[var(--accent)]/15 px-3 py-2 text-sm font-semibold text-white"
              >
                Create
              </button>
            </div>
          </section>

          <section className="rounded-[1rem] border border-white/10 bg-slate-950/45 px-4 py-4">
            <p className="text-sm font-semibold text-white">From preset</p>
            <p className="mt-1 text-xs text-slate-300">Start with bundled widget compositions.</p>
            <div className="mt-3 space-y-2">
              <select
                value={presetId}
                onChange={(event) => setPresetId(event.target.value)}
                className="w-full rounded-[0.85rem] border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
              >
                {reportPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={presetLabel}
                onChange={(event) => setPresetLabel(event.target.value)}
                className="w-full rounded-[0.85rem] border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
              />
              <button
                type="button"
                onClick={() => onCreateFromPreset(presetId, presetLabel)}
                className="w-full rounded-[0.85rem] border border-[var(--accent)]/45 bg-[var(--accent)]/15 px-3 py-2 text-sm font-semibold text-white"
              >
                Create
              </button>
            </div>
          </section>

          <section className="rounded-[1rem] border border-white/10 bg-slate-950/45 px-4 py-4">
            <p className="text-sm font-semibold text-white">Custom blank</p>
            <p className="mt-1 text-xs text-slate-300">Create your own report and add widgets manually.</p>
            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={customLabel}
                onChange={(event) => setCustomLabel(event.target.value)}
                className="w-full rounded-[0.85rem] border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
              />
              <button
                type="button"
                onClick={() => onCreateCustom(customLabel)}
                className="w-full rounded-[0.85rem] border border-[var(--accent)]/45 bg-[var(--accent)]/15 px-3 py-2 text-sm font-semibold text-white"
              >
                Create
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
