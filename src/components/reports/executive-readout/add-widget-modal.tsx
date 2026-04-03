import type { ReportSnapshot } from "@/features/reports/types";
import { widgetBundles, widgetDefinitions } from "@/features/widgets";
import type { WidgetKind } from "@/features/widgets";
import { Star, X } from "lucide-react";

type AddWidgetModalProps = {
  open: boolean;
  storyBlocks: ReportSnapshot["storyBlocks"];
  addBlockKey: string;
  newWidgetType: WidgetKind;
  widgetSearch: string;
  favoriteWidgetKinds: WidgetKind[];
  onSetAddBlockKey: (blockKey: string) => void;
  onSetNewWidgetType: (kind: WidgetKind) => void;
  onSetWidgetSearch: (query: string) => void;
  onClose: () => void;
  onAddCard: (blockKey: string, widgetType: WidgetKind) => void;
  onAddWidgetBundle?: (blockKey: string, bundleId: string) => void;
  onToggleWidgetFavorite?: (widgetKind: WidgetKind) => void;
};

export function AddWidgetModal({
  open,
  storyBlocks,
  addBlockKey,
  newWidgetType,
  widgetSearch,
  favoriteWidgetKinds,
  onSetAddBlockKey,
  onSetNewWidgetType,
  onSetWidgetSearch,
  onClose,
  onAddCard,
  onAddWidgetBundle,
  onToggleWidgetFavorite,
}: AddWidgetModalProps) {
  const favoriteSet = new Set(favoriteWidgetKinds);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
      <div className="w-full max-w-lg rounded-[1.4rem] border border-white/15 bg-[var(--panel-strong)] px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Add widget</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/5 p-2 text-white/70 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {favoriteWidgetKinds.length ? (
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-[0.16em] text-white/50">Favorites</span>
              <div className="flex flex-wrap gap-2">
                {widgetDefinitions
                  .filter((definition) => favoriteSet.has(definition.kind))
                  .map((definition) => (
                    <button
                      key={definition.kind}
                      type="button"
                      onClick={() => onSetNewWidgetType(definition.kind)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        newWidgetType === definition.kind
                          ? "border-[var(--accent)]/50 bg-[var(--accent)]/15 text-orange-50"
                          : "border-white/15 bg-slate-950/65 text-white/80 hover:text-white"
                      }`}
                    >
                      {definition.label}
                    </button>
                  ))}
              </div>
            </div>
          ) : null}

          {onAddWidgetBundle ? (
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-[0.16em] text-white/50">Preset bundles</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {widgetBundles.map((bundle) => (
                  <button
                    key={bundle.id}
                    type="button"
                    onClick={() => {
                      onAddWidgetBundle(addBlockKey, bundle.id);
                      onClose();
                    }}
                    className="rounded-[0.85rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-left transition hover:border-[var(--accent)]/45 hover:bg-slate-900/70"
                  >
                    <p className="text-sm font-semibold text-white">{bundle.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">{bundle.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-[0.16em] text-white/50">Department block</span>
            <select
              value={addBlockKey}
              onChange={(event) => onSetAddBlockKey(event.target.value)}
              className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
            >
              {storyBlocks.map((block) => (
                <option key={block.key} value={block.key}>
                  {block.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-[0.16em] text-white/50">Widget type</span>
            <input
              type="text"
              value={widgetSearch}
              onChange={(event) => onSetWidgetSearch(event.target.value)}
              placeholder="Search widgets"
              className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[var(--accent)]/45"
            />
            <div className="mt-2 max-h-44 space-y-2 overflow-y-auto rounded-[0.85rem] border border-white/12 bg-slate-950/55 px-2 py-2">
              {widgetDefinitions
                .filter((definition) =>
                  definition.label.toLowerCase().includes(widgetSearch.trim().toLowerCase()),
                )
                .map((definition) => (
                  <div
                    key={definition.kind}
                    className={`flex items-center justify-between gap-2 rounded-[0.75rem] px-2 py-2 text-sm transition ${
                      newWidgetType === definition.kind
                        ? "bg-[var(--accent)]/18 text-orange-50"
                        : "text-white/85 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSetNewWidgetType(definition.kind)}
                      className="flex-1 text-left"
                    >
                      {definition.label}
                    </button>
                    {onToggleWidgetFavorite ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleWidgetFavorite(definition.kind);
                        }}
                        className={`rounded-full border p-1 transition ${
                          favoriteSet.has(definition.kind)
                            ? "border-[var(--accent)]/55 bg-[var(--accent)]/18 text-orange-50"
                            : "border-white/20 bg-white/[0.03] text-white/50 hover:text-white"
                        }`}
                        aria-label={favoriteSet.has(definition.kind) ? "Unfavorite widget" : "Favorite widget"}
                        title={favoriteSet.has(definition.kind) ? "Unfavorite widget" : "Favorite widget"}
                      >
                        <Star className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                ))}
            </div>
          </label>
        </div>
        <button
          type="button"
          onClick={() => {
            onAddCard(addBlockKey, newWidgetType);
            onClose();
          }}
          className="mt-4 w-full rounded-[0.95rem] border border-[var(--accent)]/45 bg-[var(--accent)]/15 px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent)]/25"
        >
          Add widget
        </button>
      </div>
    </div>
  );
}
