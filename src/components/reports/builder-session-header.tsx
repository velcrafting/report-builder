"use client";

import { useTransition } from "react";
import { Eye, FileStack, LayoutTemplate, WandSparkles, Send } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { ReportBuilderSnapshot } from "@/features/reports/types";
import { updateDraftStatus } from "@/features/reports/actions";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "text-slate-400 border-white/10 bg-white/5",
  in_review: "text-amber-300 border-amber-400/30 bg-amber-400/10",
};

type BuilderSessionHeaderProps = {
  snapshot: ReportBuilderSnapshot;
  selectedTemplateId: string;
  mode: "edit" | "preview";
  onSelectTemplate: (id: string) => void;
  onSetMode: (mode: "edit" | "preview") => void;
  /** Present when builder is DB-backed */
  draftId?: string;
  currentStatus?: string;
};

export function BuilderSessionHeader({
  snapshot,
  selectedTemplateId,
  mode,
  onSelectTemplate,
  onSetMode,
  draftId,
  currentStatus,
}: BuilderSessionHeaderProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmitForReview() {
    if (!draftId) return;
    startTransition(async () => {
      await updateDraftStatus(draftId, "in_review");
    });
  }
  const selectedTemplate =
    snapshot.templates.find((template) => template.id === selectedTemplateId) ?? snapshot.templates[0];

  return (
    <SurfaceCard
      eyebrow="Editor session"
      title="Draft builder controls"
      actions={
        draftId ? (
          <div className="flex items-center gap-3">
            {currentStatus && (
              <span className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${STATUS_COLORS[currentStatus] ?? STATUS_COLORS.draft}`}>
                {STATUS_LABELS[currentStatus] ?? currentStatus}
              </span>
            )}
            {currentStatus !== "in_review" && (
              <button
                type="button"
                onClick={handleSubmitForReview}
                disabled={isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                Submit for Review
              </button>
            )}
          </div>
        ) : null
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {snapshot.templates.map((template) => {
              const isSelected = template.id === selectedTemplateId;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onSelectTemplate(template.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isSelected
                      ? "border-[var(--accent)]/45 bg-[var(--accent)]/14 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {template.label}
                </button>
              );
            })}
          </div>
          {selectedTemplate && (
          <div className="rounded-[1.45rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.03))] px-5 py-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/40">
                  Selected template
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">{selectedTemplate.label}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  {selectedTemplate.description}
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-white/45">
                {selectedTemplate.cadence}
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {snapshot.workflowNotes.map((note) => (
                <div
                  key={note}
                  className="rounded-[1.15rem] border border-white/10 bg-slate-950/45 px-4 py-3 text-sm leading-6 text-slate-200"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSetMode("edit")}
            className={`rounded-[1.35rem] border px-4 py-4 text-left transition ${
              mode === "edit"
                ? "border-[var(--accent)]/45 bg-[var(--accent)]/12"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-2.5">
                <LayoutTemplate className="h-4.5 w-4.5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Edit mode</p>
                <p className="mt-1 text-sm text-slate-300">Configure feeds, mapping, and widget setup inputs.</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onSetMode("preview")}
            className={`rounded-[1.35rem] border px-4 py-4 text-left transition ${
              mode === "preview"
                ? "border-[var(--accent)]/45 bg-[var(--accent)]/12"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-2.5">
                <Eye className="h-4.5 w-4.5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Executive preview</p>
                <p className="mt-1 text-sm text-slate-300">Primary editing surface for final report-facing widgets.</p>
              </div>
            </div>
          </button>
          <div className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-2.5">
                <FileStack className="h-4.5 w-4.5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Draft vs output</p>
                <p className="mt-1 text-sm text-slate-300">Reports are editable. Outputs will freeze this artifact later.</p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-2.5">
                <WandSparkles className="h-4.5 w-4.5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Future suggestion layer</p>
                <p className="mt-1 text-sm text-slate-300">Uploads and API feeds should eventually recommend report blocks.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}
