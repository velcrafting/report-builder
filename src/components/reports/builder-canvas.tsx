import { Grip } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { ReportBuilderSnapshot } from "@/features/reports/types";

type BuilderCanvasProps = {
  draftTitle: string;
  periodLabel: string;
  zones: ReportBuilderSnapshot["zones"];
  selectedCardId?: string;
  onSelectCard: (id: string) => void;
};

export function BuilderCanvas({
  draftTitle,
  periodLabel,
  zones,
  selectedCardId,
  onSelectCard,
}: BuilderCanvasProps) {
  return (
    <SurfaceCard eyebrow={periodLabel} title={draftTitle}>
      <div className="space-y-5">
        {zones.map((zone) => (
          <section
            key={zone.key}
            className="rounded-[1.55rem] border border-white/10 bg-slate-950/40 px-5 py-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/40">
                  {zone.title}
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{zone.purpose}</p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-white/45">
                {zone.cards.length} widgets
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {zone.cards.map((card) => {
                const isSelected = card.id === selectedCardId;

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => onSelectCard(card.id)}
                    className={`rounded-[1.25rem] border px-4 py-4 text-left transition ${
                      isSelected
                        ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 shadow-[0_0_0_1px_rgba(242,141,73,0.14)]"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl border border-white/10 bg-slate-950/45 p-2.5">
                          <Grip className="h-4 w-4 text-white/50" />
                        </div>
                        <div>
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/40">
                            {card.widgetType}
                          </p>
                          <h3 className="mt-2 text-base font-semibold text-white">{card.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-300">{card.source}</p>
                          {card.value ? (
                            <p className="mt-2 text-sm leading-6 text-slate-200">{card.value}</p>
                          ) : null}
                          {card.widgetType.toLowerCase().includes("graph") ||
                          card.widgetType.toLowerCase().includes("chart") ? (
                            <div className="mt-3 flex h-12 items-end gap-1.5 rounded-xl border border-white/10 bg-slate-950/60 px-2 py-2">
                              {[22, 30, 26, 35, 41, 39, 48].map((height, index) => (
                                <div
                                  // Demo-only spark bars until data bindings are connected.
                                  key={`${card.id}-bar-${index}`}
                                  className="w-2.5 rounded-sm bg-[var(--accent)]/70"
                                  style={{ height }}
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <p className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-white/45">
                          {card.size}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                          {card.includeInRollup ? "Roll-up candidate" : "Section only"}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                          {card.status}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </SurfaceCard>
  );
}
