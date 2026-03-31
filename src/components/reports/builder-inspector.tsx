import { LayoutTemplate, MessageSquareQuote, MoveRight, SlidersHorizontal, Sparkles } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { ReportBuilderSnapshot } from "@/features/reports/types";

type BuilderInspectorProps = {
  snapshot: ReportBuilderSnapshot;
  selectedCard?: ReportBuilderSnapshot["zones"][number]["cards"][number];
  selectedZoneTitle?: string;
  onUpdateSelectedCard: (
    patch: Partial<ReportBuilderSnapshot["zones"][number]["cards"][number]>,
  ) => void;
};

export function BuilderInspector({
  snapshot,
  selectedCard,
  selectedZoneTitle,
  onUpdateSelectedCard,
}: BuilderInspectorProps) {
  return (
    <SurfaceCard
      eyebrow="Inspector"
      title={selectedCard?.title ?? snapshot.inspector.widgetTitle}
      actions={
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-white/45">
          {selectedCard?.widgetType ?? snapshot.inspector.widgetType}
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/45 px-4 py-4">
          <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/40">
            <MessageSquareQuote className="h-3.5 w-3.5 text-[var(--accent)]" />
            Narrative goal
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{snapshot.inspector.narrativeGoal}</p>
        </div>

        <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/45 px-4 py-4">
          <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/40">
            <LayoutTemplate className="h-3.5 w-3.5 text-[var(--accent)]" />
            Selected placement
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3">
              <span className="text-sm text-slate-300">Zone</span>
              <span className="text-sm font-medium text-white">
                {selectedZoneTitle ?? snapshot.inspector.controls[0]?.value}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3">
              <span className="text-sm text-slate-300">Source binding</span>
              <span className="text-sm font-medium text-white">{selectedCard?.source ?? "Not bound"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/45 px-4 py-4">
          <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/40">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            Supporting fields
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {snapshot.inspector.supportingFields.map((field) => (
              <span
                key={field}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200"
              >
                {field}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/45 px-4 py-4">
          <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/40">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--accent)]" />
            Widget controls
          </div>
          {selectedCard ? (
            <div className="mt-4 space-y-3">
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-white/50">Title</span>
                <input
                  type="text"
                  value={selectedCard.title}
                  onChange={(event) => onUpdateSelectedCard({ title: event.target.value })}
                  className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-white/50">Source</span>
                <input
                  type="text"
                  value={selectedCard.source}
                  onChange={(event) => onUpdateSelectedCard({ source: event.target.value })}
                  className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-white/50">Value / narrative</span>
                <textarea
                  value={selectedCard.value ?? ""}
                  onChange={(event) => onUpdateSelectedCard({ value: event.target.value })}
                  rows={3}
                  className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-xs uppercase tracking-[0.16em] text-white/50">Size</span>
                  <select
                    value={selectedCard.size}
                    onChange={(event) => onUpdateSelectedCard({ size: event.target.value })}
                    className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                  >
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs uppercase tracking-[0.16em] text-white/50">Status</span>
                  <select
                    value={selectedCard.status}
                    onChange={(event) =>
                      onUpdateSelectedCard({
                        status: event.target.value as ReportBuilderSnapshot["zones"][number]["cards"][number]["status"],
                      })
                    }
                    className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                  >
                    <option value="ready">Ready</option>
                    <option value="needs-mapping">Needs mapping</option>
                    <option value="draft-only">Draft only</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={selectedCard.includeInRollup}
                  onChange={(event) => onUpdateSelectedCard({ includeInRollup: event.target.checked })}
                  className="accent-[var(--accent)]"
                />
                Include in roll-up
              </label>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {snapshot.inspector.controls.map((control) => (
                <div
                  key={control.label}
                  className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3"
                >
                  <span className="text-sm text-slate-300">{control.label}</span>
                  <span className="text-sm font-medium text-white">{control.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[1.35rem] border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-4">
          <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-orange-50">
            <MoveRight className="h-3.5 w-3.5" />
            Why this matters
          </div>
          <p className="mt-3 text-sm leading-6 text-orange-50/85">
            The builder should make it obvious how mapped uploads and future APIs become a polished
            report block, not just where a card happens to sit on a page.
          </p>
        </div>
      </div>
    </SurfaceCard>
  );
}
