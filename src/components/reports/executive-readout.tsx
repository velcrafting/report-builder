"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  MinusCircle,
  Plus,
  Sparkles,
} from "lucide-react";
import { AddWidgetModal } from "@/components/reports/executive-readout/add-widget-modal";
import { QuickAddPopover } from "@/components/reports/executive-readout/quick-add-popover";
import { StoryBlocksSection } from "@/components/reports/executive-readout/story-blocks-section";
import { WidgetControlsModal } from "@/components/reports/executive-readout/widget-controls-modal";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { ReportSnapshot } from "@/features/reports/types";
import type { WidgetKind } from "@/features/widgets";

type ExecRenderMode = "card" | "bar" | "quote";
type NewWidgetType = WidgetKind;
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

type ExecutiveReadoutProps = {
  snapshot: ReportSnapshot;
  editable?: boolean;
  hiddenCardIds?: string[];
  cardRenderModes?: Record<string, ExecRenderMode>;
  cardSizes?: Record<string, WidgetSize>;
  sectionThemes?: Record<string, SectionTheme>;
  onToggleCardVisibility?: (cardId: string) => void;
  onEditCard?: (
    cardId: string,
    patch: {
      title?: string;
      body?: string;
      metric?: string;
      supportingLabel?: string;
      widgetData?: Record<string, unknown>;
    },
  ) => void;
  onSetCardRenderMode?: (cardId: string, renderMode: ExecRenderMode) => void;
  onSetCardWidgetType?: (cardId: string, widgetType: WidgetKind) => void;
  onSetCardSize?: (cardId: string, size: WidgetSize) => void;
  onSetSectionTheme?: (blockKey: string, theme: SectionTheme) => void;
  onMoveCardToBlock?: (cardId: string, targetBlockKey: string) => void;
  onMoveSection?: (sourceKey: string, targetKey: string) => void;
  onDuplicateCard?: (cardId: string) => void;
  favoriteWidgetKinds?: WidgetKind[];
  onToggleWidgetFavorite?: (widgetKind: WidgetKind) => void;
  onAddWidgetBundle?: (blockKey: string, bundleId: string) => void;
  onEditCallout?: (index: number, patch: { title?: string; body?: string }) => void;
  onAddCard?: (blockKey: string, widgetType: NewWidgetType) => void;
};

const toneStyles = {
  highlight: {
    border: "border-emerald-400/25",
    bg: "bg-emerald-400/10",
    text: "text-emerald-100",
    icon: CheckCircle2,
  },
  risk: {
    border: "border-amber-400/25",
    bg: "bg-amber-400/10",
    text: "text-amber-100",
    icon: CircleAlert,
  },
  next: {
    border: "border-[var(--accent)]/25",
    bg: "bg-[var(--accent)]/12",
    text: "text-orange-50",
    icon: ArrowRight,
  },
} as const;

export function ExecutiveReadout({
  snapshot,
  editable = false,
  hiddenCardIds = [],
  cardRenderModes = {},
  cardSizes = {},
  sectionThemes = {},
  onToggleCardVisibility,
  onEditCard,
  onSetCardRenderMode,
  onSetCardWidgetType,
  onSetCardSize,
  onSetSectionTheme,
  onMoveCardToBlock,
  onMoveSection,
  onDuplicateCard,
  favoriteWidgetKinds = [],
  onToggleWidgetFavorite,
  onAddWidgetBundle,
  onEditCallout,
  onAddCard,
}: ExecutiveReadoutProps) {
  const [controlsCardId, setControlsCardId] = useState<string | null>(null);
  const [editingCalloutIndex, setEditingCalloutIndex] = useState<number | null>(null);
  const [addingWidget, setAddingWidget] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [addBlockKey, setAddBlockKey] = useState(snapshot.storyBlocks[0]?.key ?? "");
  const [newWidgetType, setNewWidgetType] = useState<NewWidgetType>("text_insight");
  const [widgetSearch, setWidgetSearch] = useState("");
  const hiddenIdSet = new Set(hiddenCardIds);
  const quickAddKinds =
    favoriteWidgetKinds.length > 0
      ? favoriteWidgetKinds
      : (["text_insight", "comparison", "kpi_stat", "time_series"] as WidgetKind[]);

  const controlsCard = useMemo(
    () =>
      snapshot.storyBlocks
        .flatMap((block) => block.cards)
        .find((card) => card.id === controlsCardId),
    [controlsCardId, snapshot.storyBlocks],
  );

  function openControls(card: ReportSnapshot["storyBlocks"][number]["cards"][number]) {
    setControlsCardId(card.id);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(242,141,73,0.16),_transparent_28%),linear-gradient(180deg,_rgba(12,18,29,0.96),_rgba(7,11,19,0.98))] p-7 shadow-[0_30px_100px_rgba(3,6,18,0.32)] lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/55">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
              {snapshot.periodLabel}
            </div>
            <div>
              <p className="text-sm font-medium text-white/55">{snapshot.sectionLabel}</p>
              <h1 className="mt-2 max-w-4xl text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
                {snapshot.reportTitle}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{snapshot.summary}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 px-5 py-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/40">
                Executive question
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                {snapshot.framingQuestion}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/40">
                Output state
              </p>
              <p className="mt-3 text-xl font-semibold text-white">{snapshot.outputStateLabel}</p>
              <p className="mt-1 text-sm text-slate-300">{snapshot.outputVersionLabel}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/40">
                Story frame
              </p>
              <p className="mt-3 text-xl font-semibold text-white">Three-part reporting</p>
              <p className="mt-1 text-sm text-slate-300">
                Where we started, what we learned, and where we&apos;re going next.
              </p>
            </div>

            {snapshot.topMetrics.map((metric, index) =>
              hiddenIdSet.has(`metric-${index}`) ? null : (
                <div
                  key={metric.label}
                  className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 px-5 py-5"
                >
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/40">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-sm text-[var(--accent)]">{metric.change}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{metric.context}</p>
                {editable && onToggleCardVisibility ? (
                    <button
                      type="button"
                      onClick={() => onToggleCardVisibility(`metric-${index}`)}
                      className="mt-3 inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
                    >
                      <MinusCircle className="h-3.5 w-3.5" />
                      Subtract
                    </button>
                  ) : null}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {snapshot.callouts.map((callout, index) => {
          const tone = toneStyles[callout.tone];
          const Icon = tone.icon;
          const isEditing = editingCalloutIndex === index;

          return (
            <article
              key={`${callout.title}-${index}`}
              onDoubleClick={() => editable && onEditCallout && setEditingCalloutIndex(index)}
              className={`rounded-[1.5rem] border ${tone.border} ${tone.bg} px-5 py-5`}
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-2xl border border-white/10 bg-slate-950/35 p-2.5 ${tone.text}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                {isEditing && editable && onEditCallout ? (
                  <input
                    type="text"
                    value={callout.title}
                    onChange={(event) => onEditCallout(index, { title: event.target.value })}
                    className="w-full rounded-[0.9rem] border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                  />
                ) : (
                  <p className={`text-base font-semibold ${tone.text}`}>{callout.title}</p>
                )}
              </div>
              {isEditing && editable && onEditCallout ? (
                <div className="mt-4 space-y-2">
                  <textarea
                    rows={3}
                    value={callout.body}
                    onChange={(event) => onEditCallout(index, { body: event.target.value })}
                    className="w-full rounded-[0.9rem] border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingCalloutIndex(null)}
                    className="rounded-[0.85rem] border border-white/20 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-200">{callout.body}</p>
              )}
            </article>
          );
        })}
      </section>

      <StoryBlocksSection
        storyBlocks={snapshot.storyBlocks}
        hiddenCardIds={hiddenCardIds}
        editable={editable}
        cardRenderModes={cardRenderModes}
        cardSizes={cardSizes}
        sectionThemes={sectionThemes}
        onToggleCardVisibility={onToggleCardVisibility}
        onSetCardRenderMode={onSetCardRenderMode}
        onSetCardWidgetType={onSetCardWidgetType}
        onSetSectionTheme={onSetSectionTheme}
        onMoveCardToBlock={onMoveCardToBlock}
        onMoveSection={onMoveSection}
        onDuplicateCard={onDuplicateCard}
        onOpenControls={openControls}
        onRequestAddWidget={
          onAddCard
            ? (blockKey, widgetType) => {
                setAddBlockKey(blockKey);
                setNewWidgetType(widgetType);
                setAddingWidget(true);
              }
            : undefined
        }
      />

      <SurfaceCard eyebrow="Supporting evidence" title="The numbers and details that back the story">
        <div className="overflow-hidden rounded-[1.4rem] border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-left">
            <thead className="bg-white/5 text-[0.72rem] uppercase tracking-[0.18em] text-white/45">
              <tr>
                <th className="px-4 py-3 font-medium">Evidence</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Why it matters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-slate-950/50">
              {snapshot.evidenceRows.map((row) => (
                <tr key={row.label}>
                  <td className="px-4 py-4 text-sm font-medium text-white">{row.label}</td>
                  <td className="px-4 py-4 text-sm text-slate-200">{row.value}</td>
                  <td className="px-4 py-4 text-sm leading-6 text-slate-300">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      {editable ? (
        <>
          {onAddCard ? (
            <QuickAddPopover
              open={quickAddOpen}
              storyBlocks={snapshot.storyBlocks}
              addBlockKey={addBlockKey}
              quickAddKinds={quickAddKinds}
              onSetAddBlockKey={setAddBlockKey}
              onAddCard={onAddCard}
              onAddWidgetBundle={onAddWidgetBundle}
              onMoreOptions={() => {
                setNewWidgetType("text_insight");
                setAddingWidget(true);
                setQuickAddOpen(false);
              }}
              onClose={() => setQuickAddOpen(false)}
            />
          ) : null}
          <button
            type="button"
            onClick={() => {
              setAddBlockKey(snapshot.storyBlocks[0]?.key ?? "");
              setQuickAddOpen((current) => !current);
            }}
            className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--accent)]/55 bg-[var(--accent)]/90 text-slate-950 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:scale-[1.02]"
            aria-label="Add widget"
            title="Add widget"
          >
            <Plus className="h-6 w-6" />
          </button>
        </>
      ) : null}

      {controlsCard && editable && onEditCard ? (
        <WidgetControlsModal
          key={controlsCard.id}
          controlsCard={controlsCard}
          cardRenderModes={cardRenderModes}
          cardSizes={cardSizes}
          favoriteWidgetKinds={favoriteWidgetKinds}
          onClose={() => setControlsCardId(null)}
          onEditCard={onEditCard}
          onSetCardRenderMode={onSetCardRenderMode}
          onSetCardWidgetType={onSetCardWidgetType}
          onSetCardSize={onSetCardSize}
          onToggleWidgetFavorite={onToggleWidgetFavorite}
        />
      ) : null}

      {editable && onAddCard ? (
        <AddWidgetModal
          open={addingWidget}
          storyBlocks={snapshot.storyBlocks}
          addBlockKey={addBlockKey}
          newWidgetType={newWidgetType}
          widgetSearch={widgetSearch}
          favoriteWidgetKinds={favoriteWidgetKinds}
          onSetAddBlockKey={setAddBlockKey}
          onSetNewWidgetType={setNewWidgetType}
          onSetWidgetSearch={setWidgetSearch}
          onClose={() => setAddingWidget(false)}
          onAddCard={onAddCard}
          onAddWidgetBundle={onAddWidgetBundle}
          onToggleWidgetFavorite={onToggleWidgetFavorite}
        />
      ) : null}
    </div>
  );
}
