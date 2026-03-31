"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  MinusCircle,
  Plus,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { ReportSnapshot } from "@/features/reports/types";

type ExecRenderMode = "card" | "bar" | "quote";
type NewWidgetType = "card" | "comparison" | "quote";

type ExecutiveReadoutProps = {
  snapshot: ReportSnapshot;
  editable?: boolean;
  hiddenCardIds?: string[];
  cardRenderModes?: Record<string, ExecRenderMode>;
  onToggleCardVisibility?: (cardId: string) => void;
  onEditCard?: (
    cardId: string,
    patch: { title?: string; body?: string; metric?: string; supportingLabel?: string },
  ) => void;
  onSetCardRenderMode?: (cardId: string, renderMode: ExecRenderMode) => void;
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

function renderWidgetByMode(
  mode: ExecRenderMode,
  card: ReportSnapshot["storyBlocks"][number]["cards"][number],
) {
  if (mode === "quote") {
    return (
      <div className="mt-3 rounded-[1rem] border border-[var(--accent)]/35 bg-[var(--accent)]/12 px-4 py-4">
        <p className="text-xl leading-8 tracking-[-0.02em] text-orange-50">&ldquo;{card.body}&rdquo;</p>
        {card.metric ? <p className="mt-3 text-sm font-semibold text-orange-100">{card.metric}</p> : null}
      </div>
    );
  }

  if (mode === "bar") {
    return (
      <div className="mt-4 space-y-3 rounded-[1rem] border border-white/12 bg-slate-950/65 px-4 py-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-white/55">
          <span>Current period</span>
          <span>{card.metric ?? "+12%"}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[78%] rounded-full bg-[var(--accent)]" />
        </div>
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-white/45">
          <span>Prior period</span>
          <span>{card.supportingLabel ?? "Baseline"}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[61%] rounded-full bg-white/40" />
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="mt-3 text-sm leading-6 text-slate-300">{card.body}</p>
      {card.metric ? (
        <div className="mt-4 rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-3xl font-semibold tracking-[-0.05em] text-white">{card.metric}</p>
          {card.supportingLabel ? (
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{card.supportingLabel}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export function ExecutiveReadout({
  snapshot,
  editable = false,
  hiddenCardIds = [],
  cardRenderModes = {},
  onToggleCardVisibility,
  onEditCard,
  onSetCardRenderMode,
  onEditCallout,
  onAddCard,
}: ExecutiveReadoutProps) {
  const [controlsCardId, setControlsCardId] = useState<string | null>(null);
  const [editingCalloutIndex, setEditingCalloutIndex] = useState<number | null>(null);
  const [addingWidget, setAddingWidget] = useState(false);
  const [addBlockKey, setAddBlockKey] = useState(snapshot.storyBlocks[0]?.key ?? "");
  const [newWidgetType, setNewWidgetType] = useState<NewWidgetType>("card");
  const hiddenIdSet = new Set(hiddenCardIds);

  const controlsCard = useMemo(
    () =>
      snapshot.storyBlocks
        .flatMap((block) => block.cards)
        .find((card) => card.id === controlsCardId),
    [controlsCardId, snapshot.storyBlocks],
  );

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

      {snapshot.storyBlocks.map((block, index) => {
        const visibleCards = block.cards.filter((card) => !hiddenIdSet.has(card.id));
        const showPlaceholder = editable && Boolean(onAddCard) && visibleCards.length % 2 === 1;

        return (
          <SurfaceCard
            key={block.key}
            eyebrow={`0${index + 1} · ${block.title}`}
            title={block.lead}
            contentClassName="space-y-5"
            actions={
              editable && onAddCard ? (
                <button
                  type="button"
                  onClick={() => {
                    setAddBlockKey(block.key);
                    setNewWidgetType("comparison");
                    setAddingWidget(true);
                  }}
                  className="rounded-full border border-white/15 bg-white/6 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-white/12"
                >
                  + Comparison
                </button>
              ) : undefined
            }
          >
            <p className="max-w-3xl text-sm leading-7 text-slate-300">{block.intro}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {visibleCards.map((card) => {
                const mode = cardRenderModes[card.id] ?? "card";

                return (
                  <article
                    key={card.id}
                    onDoubleClick={() => editable && setControlsCardId(card.id)}
                    className={`rounded-[1.45rem] border px-4 py-4 ${
                      mode === "quote"
                        ? "border-[var(--accent)]/35 bg-[var(--accent)]/10"
                        : "border-white/10 bg-slate-950/45"
                    } ${!showPlaceholder && visibleCards.length === 1 ? "md:col-span-2" : ""}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/40">
                        {card.eyebrow}
                      </p>
                      {editable ? (
                        <div className="flex items-center gap-2">
                          {onSetCardRenderMode ? (
                            <select
                              value={mode}
                              onChange={(event) =>
                                onSetCardRenderMode(card.id, event.target.value as ExecRenderMode)
                              }
                              className="rounded-full border border-white/15 bg-slate-950/70 px-2 py-1 text-xs text-white outline-none focus:border-[var(--accent)]/45"
                            >
                              <option value="card">Card</option>
                              <option value="bar">Bar</option>
                              <option value="quote">Quote</option>
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
                          <button
                            type="button"
                            onClick={() => setControlsCardId(card.id)}
                            className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Controls
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-white">{card.title}</h3>
                    {renderWidgetByMode(mode, card)}
                  </article>
                );
              })}
              {showPlaceholder ? (
                <button
                  type="button"
                  onClick={() => {
                    setAddBlockKey(block.key);
                    setNewWidgetType("card");
                    setAddingWidget(true);
                  }}
                  className="flex min-h-[220px] items-center justify-center rounded-[1.45rem] border border-dashed border-white/25 bg-white/[0.03] text-sm font-semibold uppercase tracking-[0.16em] text-white/55 transition hover:border-[var(--accent)]/45 hover:text-white"
                >
                  + Add block
                </button>
              ) : null}
            </div>
          </SurfaceCard>
        );
      })}

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
        <button
          type="button"
          onClick={() => {
            setAddBlockKey(snapshot.storyBlocks[0]?.key ?? "");
            setNewWidgetType("card");
            setAddingWidget(true);
          }}
          className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--accent)]/55 bg-[var(--accent)]/90 text-slate-950 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:scale-[1.02]"
          aria-label="Add widget"
          title="Add widget"
        >
          <Plus className="h-6 w-6" />
        </button>
      ) : null}

      {controlsCard && editable && onEditCard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
          <div className="w-full max-w-2xl rounded-[1.5rem] border border-white/15 bg-[var(--panel-strong)] px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Widget controls</h3>
              <button
                type="button"
                onClick={() => setControlsCardId(null)}
                className="rounded-full border border-white/20 bg-white/5 p-2 text-white/70 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-white/50">Title</span>
                <input
                  type="text"
                  value={controlsCard.title}
                  onChange={(event) => onEditCard(controlsCard.id, { title: event.target.value })}
                  className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-white/50">Body</span>
                <textarea
                  rows={4}
                  value={controlsCard.body}
                  onChange={(event) => onEditCard(controlsCard.id, { body: event.target.value })}
                  className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-xs uppercase tracking-[0.16em] text-white/50">Comparison value</span>
                  <input
                    type="text"
                    value={controlsCard.metric ?? ""}
                    placeholder="+12%"
                    onChange={(event) => onEditCard(controlsCard.id, { metric: event.target.value || undefined })}
                    className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs uppercase tracking-[0.16em] text-white/50">Supporting label</span>
                  <input
                    type="text"
                    value={controlsCard.supportingLabel ?? ""}
                    placeholder="vs prior quarter"
                    onChange={(event) =>
                      onEditCard(controlsCard.id, { supportingLabel: event.target.value || undefined })
                    }
                    className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {addingWidget && editable && onAddCard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
          <div className="w-full max-w-lg rounded-[1.4rem] border border-white/15 bg-[var(--panel-strong)] px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Add widget</h3>
              <button
                type="button"
                onClick={() => setAddingWidget(false)}
                className="rounded-full border border-white/20 bg-white/5 p-2 text-white/70 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-white/50">Section</span>
                <select
                  value={addBlockKey}
                  onChange={(event) => setAddBlockKey(event.target.value)}
                  className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                >
                  {snapshot.storyBlocks.map((block) => (
                    <option key={block.key} value={block.key}>
                      {block.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-white/50">Widget type</span>
                <select
                  value={newWidgetType}
                  onChange={(event) => setNewWidgetType(event.target.value as NewWidgetType)}
                  className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                >
                  <option value="card">Narrative card</option>
                  <option value="comparison">Comparison (+/-)</option>
                  <option value="quote">Quote block</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                onAddCard(addBlockKey, newWidgetType);
                setAddingWidget(false);
              }}
              className="mt-4 w-full rounded-[0.95rem] border border-[var(--accent)]/45 bg-[var(--accent)]/15 px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent)]/25"
            >
              Add widget
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
