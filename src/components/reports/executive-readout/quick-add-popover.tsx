import type { ReportSnapshot } from "@/features/reports/types";
import { getWidgetDefinition, widgetBundles } from "@/features/widgets";
import type { WidgetKind } from "@/features/widgets";

type QuickAddPopoverProps = {
  open: boolean;
  storyBlocks: ReportSnapshot["storyBlocks"];
  addBlockKey: string;
  quickAddKinds: WidgetKind[];
  onSetAddBlockKey: (blockKey: string) => void;
  onAddCard: (blockKey: string, widgetType: WidgetKind) => void;
  onAddWidgetBundle?: (blockKey: string, bundleId: string) => void;
  onMoreOptions: () => void;
  onClose: () => void;
};

export function QuickAddPopover({
  open,
  storyBlocks,
  addBlockKey,
  quickAddKinds,
  onSetAddBlockKey,
  onAddCard,
  onAddWidgetBundle,
  onMoreOptions,
  onClose,
}: QuickAddPopoverProps) {
  if (!open) return null;

  return (
    <>
      <button type="button" aria-label="Close quick add" onClick={onClose} className="fixed inset-0 z-30 bg-transparent" />
      <div className="fixed bottom-24 right-6 z-40 w-[340px] rounded-[1.15rem] border border-white/15 bg-[var(--panel-strong)] px-4 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Quick add</p>
        <label className="mt-3 block space-y-1">
          <span className="text-xs uppercase tracking-[0.16em] text-white/50">Department block</span>
          <select
            value={addBlockKey}
            onChange={(event) => onSetAddBlockKey(event.target.value)}
            className="w-full rounded-[0.85rem] border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
          >
            {storyBlocks.map((block) => (
              <option key={block.key} value={block.key}>
                {block.title}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickAddKinds.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => {
                onAddCard(addBlockKey, kind);
                onClose();
              }}
              className="rounded-full border border-white/15 bg-slate-950/65 px-3 py-1.5 text-xs font-semibold text-white hover:border-[var(--accent)]/45"
            >
              {getWidgetDefinition(kind).label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-2">
          {onAddWidgetBundle
            ? widgetBundles.slice(0, 2).map((bundle) => (
                <button
                  key={bundle.id}
                  type="button"
                  onClick={() => {
                    onAddWidgetBundle(addBlockKey, bundle.id);
                    onClose();
                  }}
                  className="rounded-[0.8rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-left text-xs text-slate-200 hover:border-[var(--accent)]/45"
                >
                  {bundle.label}
                </button>
              ))
            : null}
        </div>
        <button
          type="button"
          onClick={onMoreOptions}
          className="mt-3 w-full rounded-[0.85rem] border border-[var(--accent)]/45 bg-[var(--accent)]/15 px-3 py-2 text-sm font-semibold text-white"
        >
          More options
        </button>
      </div>
    </>
  );
}
