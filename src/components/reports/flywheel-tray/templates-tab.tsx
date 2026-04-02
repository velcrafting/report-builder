"use client";

import { reportCreationPresets } from "@/features/reports/report-presets";
import type { ReportCreationPreset } from "@/features/reports/report-presets";

type TemplatesTabProps = {
  onApplyPreset: (presetId: string) => void;
};

export function TemplatesTab({ onApplyPreset }: TemplatesTabProps) {
  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      {reportCreationPresets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onApplyPreset(preset.id)}
          className="rounded-[0.85rem] border border-white/10 bg-slate-950/60 px-3 py-2.5 text-left transition hover:border-[var(--accent)]/30"
        >
          <p className="text-sm font-medium text-white">{preset.label}</p>
          <p className="mt-0.5 text-xs text-white/45">{preset.description}</p>
          <p className="mt-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--accent)]">
            {Object.values(preset.blockPlan).flat().length} widgets
          </p>
        </button>
      ))}
    </div>
  );
}
