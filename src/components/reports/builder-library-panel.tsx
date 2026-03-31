import { WandSparkles } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { ReportBuilderSnapshot } from "@/features/reports/types";

type BuilderLibraryPanelProps = {
  snapshot: ReportBuilderSnapshot;
  onSelectWidget: (id: string) => void;
};

export function BuilderLibraryPanel({
  snapshot,
  onSelectWidget,
}: BuilderLibraryPanelProps) {
  return (
    <SurfaceCard eyebrow="Inputs and widgets" title="Mapped ingredients and data feeds">
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/40">
            Data feeds
          </p>
          <div className="space-y-2">
            {snapshot.dataFeeds.map((feed) => (
              <div
                key={feed.id}
                className="rounded-[1.2rem] border border-white/10 bg-slate-950/45 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{feed.label}</p>
                    <p className="mt-1 text-sm text-slate-300">{feed.detail}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-white/45">
                    {feed.kind}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {snapshot.libraryGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/40">
              {group.title}
            </p>
            <div className="space-y-2">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectWidget(item.id)}
                  className="w-full rounded-[1.2rem] border border-white/10 bg-slate-950/45 px-4 py-3 text-left transition hover:border-white/20 hover:bg-slate-950/65"
                >
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-300">{item.meta}</p>
                  <p className="mt-2 text-[0.68rem] uppercase tracking-[0.18em] text-[var(--accent)]">
                    {item.widgetType}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-[1.35rem] border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-4">
          <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-orange-50">
            <WandSparkles className="h-3.5 w-3.5" />
            Suggestion layer
          </div>
          <p className="mt-3 text-sm leading-6 text-orange-50/85">
            Uploaded CSV feeds and future APIs should eventually recommend widgets, fields, and
            block layouts instead of leaving the editor to start from zero.
          </p>
        </div>
      </div>
    </SurfaceCard>
  );
}
