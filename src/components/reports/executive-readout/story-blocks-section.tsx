import { useState } from "react";
import { Copy, GripVertical, MinusCircle, SlidersHorizontal } from "lucide-react";
import { ExecutiveWidgetRenderer } from "@/components/reports/executive-widget-renderer";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { ReportSnapshot } from "@/features/reports/types";
import { getWidgetDefinition, inferWidgetKindFromCard, widgetDefinitions } from "@/features/widgets";
import type { WidgetKind } from "@/features/widgets";

type ExecRenderMode = "card" | "bar" | "quote";
type WidgetSize = "small" | "medium" | "large";
type SectionTheme =
  | "default"
  | "teal"
  | "amber"
  | "rose"
  | "sky"
  | "violet"
  | "emerald"
  | "slate";
type StoryCard = ReportSnapshot["storyBlocks"][number]["cards"][number];

const sectionThemeStyles: Record<SectionTheme, string> = {
  default: "",
  teal: "border-teal-400/30 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.12),transparent_36%)]",
  amber: "border-amber-400/28 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_36%)]",
  rose: "border-rose-400/28 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.12),transparent_36%)]",
  sky: "border-sky-400/28 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_36%)]",
  violet:
    "border-violet-400/28 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_36%)]",
  emerald:
    "border-emerald-400/28 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_36%)]",
  slate:
    "border-slate-300/22 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.10),transparent_36%)]",
};

type StoryBlocksSectionProps = {
  storyBlocks: ReportSnapshot["storyBlocks"];
  hiddenCardIds: string[];
  editable: boolean;
  cardRenderModes: Record<string, ExecRenderMode>;
  cardSizes: Record<string, WidgetSize>;
  sectionThemes: Record<string, SectionTheme>;
  onToggleCardVisibility?: (cardId: string) => void;
  onSetCardRenderMode?: (cardId: string, renderMode: ExecRenderMode) => void;
  onSetCardWidgetType?: (cardId: string, widgetType: WidgetKind) => void;
  onSetSectionTheme?: (blockKey: string, theme: SectionTheme) => void;
  onMoveCardToBlock?: (cardId: string, targetBlockKey: string) => void;
  onMoveSection?: (sourceKey: string, targetKey: string) => void;
  onDuplicateCard?: (cardId: string) => void;
  onOpenControls: (card: StoryCard) => void;
  onRequestAddWidget?: (blockKey: string, widgetType: WidgetKind) => void;
};

export function StoryBlocksSection({
  storyBlocks,
  hiddenCardIds,
  editable,
  cardRenderModes,
  cardSizes,
  sectionThemes,
  onToggleCardVisibility,
  onSetCardRenderMode,
  onSetCardWidgetType,
  onSetSectionTheme,
  onMoveCardToBlock,
  onMoveSection,
  onDuplicateCard,
  onOpenControls,
  onRequestAddWidget,
}: StoryBlocksSectionProps) {
  const hiddenIdSet = new Set(hiddenCardIds);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [draggedSectionKey, setDraggedSectionKey] = useState<string | null>(null);
  const [dropTargetBlockKey, setDropTargetBlockKey] = useState<string | null>(null);

  return (
    <>
      {storyBlocks.map((block, index) => {
        const visibleCards = block.cards.filter((card) => !hiddenIdSet.has(card.id));
        const showPlaceholder = editable && Boolean(onRequestAddWidget) && visibleCards.length % 2 === 1;
        const sectionTheme = sectionThemes[block.key] ?? "default";
        const isDropTarget = dropTargetBlockKey === block.key;

        return (
          <div
            key={block.key}
            onDragEnter={(event) => {
              if (editable && (draggedCardId || draggedSectionKey)) {
                event.preventDefault();
                setDropTargetBlockKey(block.key);
              }
            }}
            onDragOver={(event) => {
              if (editable && (draggedCardId || draggedSectionKey)) {
                event.preventDefault();
                setDropTargetBlockKey(block.key);
              }
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setDropTargetBlockKey((current) => (current === block.key ? null : current));
              }
            }}
            onDrop={() => {
              if (draggedCardId && onMoveCardToBlock) {
                onMoveCardToBlock(draggedCardId, block.key);
              }
              if (draggedSectionKey && onMoveSection) {
                onMoveSection(draggedSectionKey, block.key);
              }
              setDraggedCardId(null);
              setDraggedSectionKey(null);
              setDropTargetBlockKey(null);
            }}
            className="relative"
          >
            {isDropTarget ? (
              <div className="pointer-events-none absolute inset-x-0 -top-3 z-10 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/55 bg-[var(--accent)]/14 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-orange-50 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_18px_40px_rgba(242,141,73,0.14)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                  Drop into {block.title}
                </div>
              </div>
            ) : null}
            {isDropTarget ? (
              <div className="pointer-events-none absolute inset-0 z-0 rounded-[1.7rem] border border-dashed border-[var(--accent)]/60 bg-[linear-gradient(180deg,rgba(242,141,73,0.12),rgba(242,141,73,0.04))] shadow-[inset_0_0_0_1px_rgba(242,141,73,0.12),0_0_0_1px_rgba(242,141,73,0.08)]" />
            ) : null}
            <SurfaceCard
              className={`relative ${sectionThemeStyles[sectionTheme]} ${isDropTarget ? "ring-1 ring-[var(--accent)]/25" : ""}`}
              eyebrow={`0${index + 1} · ${block.title}`}
              title={block.lead}
              contentClassName="space-y-5"
              actions={
                editable ? (
                  <div className="flex items-center gap-2">
                    {onSetSectionTheme ? (
                      <select
                        value={sectionTheme}
                        onChange={(event) => onSetSectionTheme(block.key, event.target.value as SectionTheme)}
                        className="rounded-full border border-white/15 bg-slate-950/70 px-2 py-1 text-xs text-white outline-none focus:border-[var(--accent)]/45"
                      >
                        <option value="default">Default</option>
                        <option value="teal">Teal</option>
                        <option value="amber">Amber</option>
                        <option value="rose">Rose</option>
                        <option value="sky">Sky</option>
                        <option value="violet">Violet</option>
                        <option value="emerald">Emerald</option>
                        <option value="slate">Slate</option>
                      </select>
                    ) : null}
                    {onRequestAddWidget ? (
                      <button
                        type="button"
                        onClick={() => onRequestAddWidget(block.key, "comparison")}
                        className="rounded-full border border-white/15 bg-white/6 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-white/12"
                      >
                        + Comparison
                      </button>
                    ) : null}
                    <button
                      type="button"
                      draggable
                      onDragStart={() => setDraggedSectionKey(block.key)}
                      onDragEnd={() => {
                        setDraggedSectionKey(null);
                        setDropTargetBlockKey((current) => (current === block.key ? null : current));
                      }}
                      className="rounded-full border border-white/15 bg-white/6 px-2 py-1.5 text-xs text-white/70 hover:text-white"
                      title="Drag section"
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : undefined
              }
            >
              <p className="max-w-3xl text-sm leading-7 text-slate-300">{block.intro}</p>
              <div className="grid gap-4 md:grid-cols-2">
                {visibleCards.map((card) => {
                  const widgetKind = inferWidgetKindFromCard(card);
                  const widgetDefinition = getWidgetDefinition(widgetKind);
                  const mode = cardRenderModes[card.id] ?? widgetDefinition.defaultRenderMode;
                  const size = cardSizes[card.id] ?? "medium";
                  const isWide = size === "large" || (!showPlaceholder && visibleCards.length === 1);

                  return (
                    <article
                      key={card.id}
                      draggable={editable}
                      onDragStart={() => setDraggedCardId(card.id)}
                      onDragEnd={() => {
                        setDraggedCardId(null);
                        setDropTargetBlockKey(null);
                      }}
                      onDoubleClick={() => editable && onOpenControls(card)}
                      className={`rounded-[1.45rem] border px-4 py-4 transition ${
                        mode === "quote"
                          ? "border-[var(--accent)]/35 bg-[var(--accent)]/10"
                          : "border-white/10 bg-slate-950/45"
                      } ${isWide ? "md:col-span-2" : ""} ${draggedCardId === card.id ? "opacity-70" : ""}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/40">
                          {card.eyebrow}
                        </p>
                        {editable ? (
                          <div className="flex items-center gap-2">
                            {onSetCardWidgetType ? (
                              <select
                                value={widgetKind}
                                onChange={(event) => onSetCardWidgetType(card.id, event.target.value as WidgetKind)}
                                className="rounded-full border border-white/15 bg-slate-950/70 px-2 py-1 text-xs text-white outline-none focus:border-[var(--accent)]/45"
                              >
                                {widgetDefinitions.map((definition) => (
                                  <option key={definition.kind} value={definition.kind}>
                                    {definition.label}
                                  </option>
                                ))}
                              </select>
                            ) : null}
                            {onSetCardRenderMode ? (
                              <select
                                value={mode}
                                onChange={(event) => onSetCardRenderMode(card.id, event.target.value as ExecRenderMode)}
                                className="rounded-full border border-white/15 bg-slate-950/70 px-2 py-1 text-xs text-white outline-none focus:border-[var(--accent)]/45"
                              >
                                {widgetDefinition.supportedRenderModes.includes("card") ? (
                                  <option value="card">Card</option>
                                ) : null}
                                {widgetDefinition.supportedRenderModes.includes("bar") ? (
                                  <option value="bar">Bar</option>
                                ) : null}
                                {widgetDefinition.supportedRenderModes.includes("quote") ? (
                                  <option value="quote">Quote</option>
                                ) : null}
                              </select>
                            ) : null}
                            {onToggleCardVisibility ? (
                              <button
                                type="button"
                                onClick={() => onToggleCardVisibility(card.id)}
                                className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
                              >
                                <MinusCircle className="h-3.5 w-3.5" />
                                Subtract
                              </button>
                            ) : null}
                            {onDuplicateCard ? (
                              <button
                                type="button"
                                onClick={() => onDuplicateCard(card.id)}
                                className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Duplicate
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => onOpenControls(card)}
                              className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                              Controls
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-white">{card.title}</h3>
                      <ExecutiveWidgetRenderer kind={widgetKind} mode={mode} card={card} />
                    </article>
                  );
                })}
                {showPlaceholder ? (
                  <button
                    type="button"
                    onClick={() => onRequestAddWidget?.(block.key, "text_insight")}
                    className="flex min-h-[220px] items-center justify-center rounded-[1.45rem] border border-dashed border-white/25 bg-white/[0.03] text-sm font-semibold uppercase tracking-[0.16em] text-white/55 transition hover:border-[var(--accent)]/45 hover:text-white"
                  >
                    + Add block
                  </button>
                ) : null}
              </div>
            </SurfaceCard>
          </div>
        );
      })}
    </>
  );
}
