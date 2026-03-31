import { Star } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { widgetBundles, widgetDefinitions } from "@/features/widgets";
import type { WidgetKind, WidgetLayer } from "@/features/widgets";

type WidgetRegistryPanelProps = {
  targetBlockKey: string;
  sections: Array<{ key: string; title: string }>;
  favoriteKinds: WidgetKind[];
  onChangeTargetBlock: (blockKey: string) => void;
  onAddWidget: (blockKey: string, widgetKind: WidgetKind) => void;
  onToggleFavorite: (widgetKind: WidgetKind) => void;
  onAddBundle: (blockKey: string, bundleId: string) => void;
};

const layerOrder: WidgetLayer[] = ["metric", "narrative", "structural"];

const layerLabels: Record<WidgetLayer, string> = {
  metric: "Metric primitives",
  narrative: "Narrative primitives",
  structural: "Structural primitives",
};

export function WidgetRegistryPanel({
  targetBlockKey,
  sections,
  favoriteKinds,
  onChangeTargetBlock,
  onAddWidget,
  onToggleFavorite,
  onAddBundle,
}: WidgetRegistryPanelProps) {
  const favoriteSet = new Set(favoriteKinds);

  return (
    <SurfaceCard eyebrow="Widget registry" title="Add from a typed widget system">
      <div className="space-y-4">
        <label className="block space-y-1">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/45">
            Target section
          </span>
          <select
            value={targetBlockKey}
            onChange={(event) => onChangeTargetBlock(event.target.value)}
            className="w-full rounded-[0.95rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
          >
            {sections.map((section) => (
              <option key={section.key} value={section.key}>
                {section.title}
              </option>
            ))}
          </select>
        </label>

        <section className="rounded-[1.2rem] border border-white/10 bg-slate-950/45 px-3 py-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/45">
            Preset bundles
          </p>
          <div className="mt-3 grid gap-2 lg:grid-cols-3">
            {widgetBundles.map((bundle) => (
              <button
                key={bundle.id}
                type="button"
                onClick={() => onAddBundle(targetBlockKey, bundle.id)}
                className="rounded-[0.9rem] border border-white/12 bg-white/[0.04] px-3 py-3 text-left transition hover:border-[var(--accent)]/45 hover:bg-white/[0.08]"
              >
                <p className="text-sm font-semibold text-white">{bundle.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">{bundle.description}</p>
              </button>
            ))}
          </div>
        </section>

        {favoriteKinds.length ? (
          <section className="rounded-[1.2rem] border border-white/10 bg-slate-950/45 px-3 py-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/45">
              Favorites
            </p>
            <div className="mt-3 grid gap-2 lg:grid-cols-3">
              {widgetDefinitions
                .filter((definition) => favoriteSet.has(definition.kind))
                .map((definition) => (
                  <button
                    key={definition.kind}
                    type="button"
                    onClick={() => onAddWidget(targetBlockKey, definition.kind)}
                    className="rounded-[0.9rem] border border-white/12 bg-white/[0.04] px-3 py-2 text-left text-sm text-white transition hover:border-[var(--accent)]/45 hover:bg-white/[0.08]"
                  >
                    {definition.label}
                  </button>
                ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          {layerOrder.map((layer) => {
            const defs = widgetDefinitions.filter((definition) => definition.layer === layer);
            return (
              <section
                key={layer}
                className="rounded-[1.2rem] border border-white/10 bg-slate-950/45 px-3 py-3"
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/45">
                  {layerLabels[layer]}
                </p>
                <div className="mt-3 space-y-2">
                  {defs.map((definition) => (
                    <div
                      key={definition.kind}
                      className="flex items-center gap-2 rounded-[0.85rem] border border-white/12 bg-white/[0.04] px-2 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => onAddWidget(targetBlockKey, definition.kind)}
                        className="flex-1 rounded-[0.65rem] px-2 py-1.5 text-left text-sm text-white transition hover:bg-white/[0.06]"
                      >
                        {definition.label}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(definition.kind)}
                        className={`rounded-full border p-1.5 transition ${
                          favoriteSet.has(definition.kind)
                            ? "border-[var(--accent)]/55 bg-[var(--accent)]/18 text-orange-50"
                            : "border-white/20 bg-white/[0.03] text-white/55 hover:text-white"
                        }`}
                        title={favoriteSet.has(definition.kind) ? "Unpin favorite" : "Pin favorite"}
                        aria-label={favoriteSet.has(definition.kind) ? "Unpin favorite" : "Pin favorite"}
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </SurfaceCard>
  );
}
