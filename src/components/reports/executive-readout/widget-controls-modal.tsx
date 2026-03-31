import { useState } from "react";
import { Star, X } from "lucide-react";
import type { ReportSnapshot } from "@/features/reports/types";
import { getWidgetDefinition, inferWidgetKindFromCard, widgetDefinitions } from "@/features/widgets";
import type { WidgetKind } from "@/features/widgets";

type ExecRenderMode = "card" | "bar" | "quote";
type WidgetSize = "small" | "medium" | "large";
type StoryCard = ReportSnapshot["storyBlocks"][number]["cards"][number];

type WidgetControlsModalProps = {
  controlsCard: StoryCard | null;
  cardRenderModes: Record<string, ExecRenderMode>;
  cardSizes: Record<string, WidgetSize>;
  favoriteWidgetKinds: WidgetKind[];
  onClose: () => void;
  onEditCard: (
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
  onToggleWidgetFavorite?: (widgetKind: WidgetKind) => void;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asNumberList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === "number" ? item : Number(item))).filter(Number.isFinite);
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter((item) => item.trim().length > 0);
}

function parseCsvNumbers(value: string): number[] {
  if (!value.trim()) return [];
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter(Number.isFinite);
}

function parseCsvStrings(value: string): string[] {
  if (!value.trim()) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function WidgetControlsModal({
  controlsCard,
  cardRenderModes,
  cardSizes,
  favoriteWidgetKinds,
  onClose,
  onEditCard,
  onSetCardRenderMode,
  onSetCardWidgetType,
  onSetCardSize,
  onToggleWidgetFavorite,
}: WidgetControlsModalProps) {
  const [widgetDataDraft, setWidgetDataDraft] = useState(() =>
    JSON.stringify(controlsCard?.widgetData ?? {}, null, 2),
  );
  const [widgetDataError, setWidgetDataError] = useState<string | null>(null);
  const [showAdvancedData, setShowAdvancedData] = useState(false);
  const favoriteSet = new Set(favoriteWidgetKinds);

  if (!controlsCard) return null;

  function applyControlsWidgetData(nextData: Record<string, unknown>) {
    if (!controlsCard) return;
    onEditCard(controlsCard.id, { widgetData: nextData });
    setWidgetDataDraft(JSON.stringify(nextData, null, 2));
    setWidgetDataError(null);
  }

  function updateControlsWidgetDataField(field: string, value: unknown) {
    if (!controlsCard) return;
    const current = asRecord(controlsCard.widgetData);
    applyControlsWidgetData({ ...current, [field]: value });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
      <div className="w-full max-w-2xl rounded-[1.5rem] border border-white/15 bg-[var(--panel-strong)] px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Widget controls</h3>
          <button
            type="button"
            onClick={() => {
              onClose();
              setWidgetDataError(null);
            }}
            className="rounded-full border border-white/20 bg-white/5 p-2 text-white/70 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-[0.16em] text-white/50">Widget type</span>
            <select
              value={inferWidgetKindFromCard(controlsCard)}
              onChange={(event) => onSetCardWidgetType?.(controlsCard.id, event.target.value as WidgetKind)}
              className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
            >
              {widgetDefinitions.map((definition) => (
                <option key={definition.kind} value={definition.kind}>
                  {definition.label}
                </option>
              ))}
            </select>
          </label>
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
              <span className="text-xs uppercase tracking-[0.16em] text-white/50">Render mode</span>
              <select
                value={cardRenderModes[controlsCard.id] ?? "card"}
                onChange={(event) => onSetCardRenderMode?.(controlsCard.id, event.target.value as ExecRenderMode)}
                className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
              >
                {getWidgetDefinition(inferWidgetKindFromCard(controlsCard)).supportedRenderModes.includes("card") ? (
                  <option value="card">Card</option>
                ) : null}
                {getWidgetDefinition(inferWidgetKindFromCard(controlsCard)).supportedRenderModes.includes("bar") ? (
                  <option value="bar">Bar</option>
                ) : null}
                {getWidgetDefinition(inferWidgetKindFromCard(controlsCard)).supportedRenderModes.includes("quote") ? (
                  <option value="quote">Quote</option>
                ) : null}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-[0.16em] text-white/50">Size</span>
              <select
                value={cardSizes[controlsCard.id] ?? "medium"}
                onChange={(event) => onSetCardSize?.(controlsCard.id, event.target.value as WidgetSize)}
                className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>
            {onToggleWidgetFavorite ? (
              <div className="block space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-white/50">Favorite</span>
                <button
                  type="button"
                  onClick={() => onToggleWidgetFavorite(inferWidgetKindFromCard(controlsCard))}
                  className={`inline-flex h-[42px] items-center gap-2 rounded-[0.9rem] border px-3 text-sm font-medium transition ${
                    favoriteSet.has(inferWidgetKindFromCard(controlsCard))
                      ? "border-[var(--accent)]/50 bg-[var(--accent)]/15 text-orange-50"
                      : "border-white/15 bg-slate-950/65 text-white hover:bg-slate-900/70"
                  }`}
                >
                  <Star className="h-4 w-4" />
                  {favoriteSet.has(inferWidgetKindFromCard(controlsCard)) ? "Favorited" : "Add to favorites"}
                </button>
              </div>
            ) : null}
          </div>
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
          <div className="rounded-[0.95rem] border border-white/10 bg-slate-950/35 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Widget data</p>
            {(() => {
              const kind = inferWidgetKindFromCard(controlsCard);
              const data = asRecord(controlsCard.widgetData);

              if (kind === "sparkline" || kind === "time_series" || kind === "kpi_stat") {
                return (
                  <label className="mt-2 block space-y-1">
                    <span className="text-xs text-white/60">Values (comma separated)</span>
                    <input
                      type="text"
                      value={asNumberList(data.values).join(", ")}
                      placeholder="12, 18, 24, 30"
                      onChange={(event) => updateControlsWidgetDataField("values", parseCsvNumbers(event.target.value))}
                      className="w-full rounded-[0.8rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                    />
                  </label>
                );
              }

              if (kind === "ranked_bar") {
                return (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="block space-y-1">
                      <span className="text-xs text-white/60">Values (comma separated)</span>
                      <input
                        type="text"
                        value={asNumberList(data.values).join(", ")}
                        placeholder="88, 72, 56, 41"
                        onChange={(event) =>
                          updateControlsWidgetDataField("values", parseCsvNumbers(event.target.value))
                        }
                        className="w-full rounded-[0.8rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs text-white/60">Labels (comma separated)</span>
                      <input
                        type="text"
                        value={asStringList(data.labels).join(", ")}
                        placeholder="North, East, West, Other"
                        onChange={(event) =>
                          updateControlsWidgetDataField("labels", parseCsvStrings(event.target.value))
                        }
                        className="w-full rounded-[0.8rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                      />
                    </label>
                  </div>
                );
              }

              if (kind === "table") {
                const rows = Array.isArray(data.rows)
                  ? data.rows
                      .map((row) => {
                        const candidate = asRecord(row);
                        return {
                          label: typeof candidate.label === "string" ? candidate.label : "",
                          value: candidate.value !== undefined ? String(candidate.value) : "",
                        };
                      })
                      .filter((row) => row.label || row.value)
                  : [];
                const effectiveRows = rows.length ? rows : [{ label: "", value: "" }];

                return (
                  <div className="mt-2 space-y-2">
                    {effectiveRows.map((row, index) => (
                      <div key={`row-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <input
                          type="text"
                          value={row.label}
                          placeholder="Label"
                          onChange={(event) => {
                            const nextRows = [...effectiveRows];
                            nextRows[index] = { ...nextRows[index], label: event.target.value };
                            applyControlsWidgetData({
                              ...data,
                              rows: nextRows.filter((nextRow) => nextRow.label || nextRow.value),
                            });
                          }}
                          className="rounded-[0.8rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                        />
                        <input
                          type="text"
                          value={row.value}
                          placeholder="Value"
                          onChange={(event) => {
                            const nextRows = [...effectiveRows];
                            nextRows[index] = { ...nextRows[index], value: event.target.value };
                            applyControlsWidgetData({
                              ...data,
                              rows: nextRows.filter((nextRow) => nextRow.label || nextRow.value),
                            });
                          }}
                          className="rounded-[0.8rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextRows = effectiveRows.filter((_, rowIndex) => rowIndex !== index);
                            applyControlsWidgetData({
                              ...data,
                              rows: nextRows.filter((nextRow) => nextRow.label || nextRow.value),
                            });
                          }}
                          className="rounded-[0.8rem] border border-white/20 bg-white/5 px-2 py-2 text-xs text-white/70 hover:text-white"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        applyControlsWidgetData({ ...data, rows: [...effectiveRows, { label: "", value: "" }] })
                      }
                      className="rounded-[0.8rem] border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:text-white"
                    >
                      Add row
                    </button>
                  </div>
                );
              }

              if (kind === "timeline") {
                const events = asStringList(data.events);
                const effectiveEvents = events.length ? events : [""];
                return (
                  <div className="mt-2 space-y-2">
                    {effectiveEvents.map((eventValue, index) => (
                      <div key={`event-${index}`} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <input
                          type="text"
                          value={eventValue}
                          placeholder="Event label"
                          onChange={(event) => {
                            const nextEvents = [...effectiveEvents];
                            nextEvents[index] = event.target.value;
                            updateControlsWidgetDataField(
                              "events",
                              nextEvents.filter((item) => item.trim().length > 0),
                            );
                          }}
                          className="rounded-[0.8rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateControlsWidgetDataField(
                              "events",
                              effectiveEvents
                                .filter((_, eventIndex) => eventIndex !== index)
                                .filter((item) => item.trim().length > 0),
                            )
                          }
                          className="rounded-[0.8rem] border border-white/20 bg-white/5 px-2 py-2 text-xs text-white/70 hover:text-white"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateControlsWidgetDataField("events", [...effectiveEvents, ""])}
                      className="rounded-[0.8rem] border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:text-white"
                    >
                      Add event
                    </button>
                  </div>
                );
              }

              if (kind === "comparison") {
                const current = typeof data.current === "number" ? data.current : 78;
                const prior = typeof data.prior === "number" ? data.prior : 61;
                return (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="block space-y-1">
                      <span className="text-xs text-white/60">Current (%)</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={current}
                        onChange={(event) =>
                          updateControlsWidgetDataField("current", Number(event.target.value || "0"))
                        }
                        className="w-full rounded-[0.8rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs text-white/60">Prior (%)</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={prior}
                        onChange={(event) =>
                          updateControlsWidgetDataField("prior", Number(event.target.value || "0"))
                        }
                        className="w-full rounded-[0.8rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
                      />
                    </label>
                  </div>
                );
              }

              return (
                <p className="mt-2 text-xs text-slate-300">
                  This widget does not require structured data fields. Use advanced JSON mode for custom data.
                </p>
              );
            })()}

            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowAdvancedData((current) => !current)}
                className="rounded-[0.8rem] border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:text-white"
              >
                {showAdvancedData ? "Hide advanced JSON mode" : "Show advanced JSON mode"}
              </button>
            </div>

            {showAdvancedData ? (
              <label className="mt-3 block space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-white/50">Manual widget data (JSON)</span>
                <textarea
                  rows={8}
                  value={widgetDataDraft}
                  onChange={(event) => {
                    const nextDraft = event.target.value;
                    setWidgetDataDraft(nextDraft);

                    if (!nextDraft.trim()) {
                      onEditCard(controlsCard.id, { widgetData: {} });
                      setWidgetDataError(null);
                      return;
                    }

                    try {
                      const parsed = JSON.parse(nextDraft);
                      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                        onEditCard(controlsCard.id, { widgetData: parsed as Record<string, unknown> });
                        setWidgetDataError(null);
                      } else {
                        setWidgetDataError("Widget data must be a JSON object.");
                      }
                    } catch {
                      setWidgetDataError("Invalid JSON. Fix syntax to apply widget data.");
                    }
                  }}
                  className="w-full rounded-[0.9rem] border border-white/15 bg-slate-950/65 px-3 py-2 font-mono text-xs text-white outline-none focus:border-[var(--accent)]/45"
                />
                {widgetDataError ? <p className="text-xs text-rose-300">{widgetDataError}</p> : null}
              </label>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
