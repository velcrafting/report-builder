"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Redo2, Undo2 } from "lucide-react";
import { CreateReportModal } from "@/components/reports/create-report-modal";
import {
  ExecutiveCommandPalette,
  type ExecutiveCommandPaletteAction,
} from "@/components/reports/executive-command-palette";
import { ExecutiveReadout } from "@/components/reports/executive-readout";
import { SurfaceCard } from "@/components/ui/surface-card";
import { createBlankReport, createReportFromPreset, reportCreationPresets } from "@/features/reports/report-presets";
import type { ReportBuilderSnapshot, ReportSnapshot } from "@/features/reports/types";
import {
  createStoryCardFromWidgetKind,
  DEFAULT_FAVORITE_WIDGETS,
  getWidgetBundle,
  getWidgetDefinition,
} from "@/features/widgets";
import type { WidgetKind } from "@/features/widgets";
import {
  saveWidgetInstance,
  deleteWidgetInstance,
  updateDraftSummary,
} from "@/features/reports/actions";
import type { ReportDraftRow, WidgetInstanceRow } from "@/lib/db/reportDrafts";
import { useHistoryStack } from "./use-history-stack";
import { BuilderCanvas } from "./builder-canvas";
import { BuilderInspector } from "./builder-inspector";
import { BuilderLibraryPanel } from "./builder-library-panel";
import { BuilderSessionHeader } from "./builder-session-header";

type ReportBuilderWorkspaceProps =
  | {
      snapshot: ReportBuilderSnapshot;
      initialDraft?: undefined;
      initialWidgets?: undefined;
    }
  | {
      snapshot?: undefined;
      initialDraft: ReportDraftRow;
      initialWidgets: WidgetInstanceRow[];
    };

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

type TemplatePreviewState = {
  templateReports: Record<string, ReportSnapshot>;
  hiddenCardsByTemplate: Record<string, string[]>;
  renderModesByTemplate: Record<string, Record<string, ExecRenderMode>>;
  cardSizesByTemplate: Record<string, Record<string, WidgetSize>>;
  sectionThemesByTemplate: Record<string, Record<string, SectionTheme>>;
};

const accentThemes = [
  { label: "Tangerine", accent: "#f28d49", accentStrong: "#ffac73" },
  { label: "Teal", accent: "#2bb8a6", accentStrong: "#64e0d1" },
  { label: "Rose", accent: "#ea6682", accentStrong: "#f29eb0" },
  { label: "Sky", accent: "#4e94ff", accentStrong: "#8cb9ff" },
  { label: "Violet", accent: "#8b5cf6", accentStrong: "#b59bff" },
  { label: "Emerald", accent: "#10b981", accentStrong: "#4dd4a2" },
  { label: "Slate", accent: "#94a3b8", accentStrong: "#c4cedd" },
];

export function ReportBuilderWorkspace({ snapshot, initialDraft, initialWidgets }: ReportBuilderWorkspaceProps) {
  // DB-backed mode uses initialDraft; mock mode uses snapshot
  const isDbBacked = initialDraft !== undefined;
  const draftId = initialDraft?.id ?? null;

  const [, startTransition] = useTransition();

  // When in DB-backed mode, build a minimal snapshot-like shape from the draft
  const resolvedSnapshot: ReportBuilderSnapshot | null = snapshot ?? null;
  const fallbackTemplate = resolvedSnapshot?.templates[0] ?? null;
  const [templates, setTemplates] = useState(resolvedSnapshot?.templates ?? []);
  const [zones, setZones] = useState<ReportBuilderSnapshot["zones"]>(
    resolvedSnapshot?.zones ??
      (initialWidgets ?? []).map((w) => ({
        key: w.zoneKey,
        title: w.zoneKey,
        purpose: "",
        cards: [
          {
            id: w.id,
            widgetType: w.widgetType,
            title: w.widgetType,
            source: "",
            size: w.size as string,
            includeInRollup: w.includeInRollup ?? false,
            status: "ready" as const,
          },
        ],
      }))
  );
  const [draftTitle, setDraftTitle] = useState(resolvedSnapshot?.draftTitle ?? initialDraft?.title ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState(resolvedSnapshot?.selectedTemplateId ?? "");
  const [selectedWidgetId, setSelectedWidgetId] = useState(resolvedSnapshot?.selectedWidgetId ?? "");
  const [mode, setMode] = useState<"edit" | "preview">("preview");
  const [templateName, setTemplateName] = useState("");
  const [themeKey, setThemeKey] = useState(accentThemes[0].label);
  const [saveNotice, setSaveNotice] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [favorites, setFavorites] = useState<WidgetKind[]>(DEFAULT_FAVORITE_WIDGETS);
  const [createReportOpen, setCreateReportOpen] = useState(false);
  const previewHistory = useHistoryStack<TemplatePreviewState>({
    templateReports: Object.fromEntries(
      (resolvedSnapshot?.templates ?? []).map((template) => [template.id, template.previewReport])
    ),
    hiddenCardsByTemplate: {},
    renderModesByTemplate: {},
    cardSizesByTemplate: {},
    sectionThemesByTemplate: {},
  });

  const selectedTemplate = useMemo(
    () =>
      templates.find((template) => template.id === selectedTemplateId) ??
      templates[0] ??
      fallbackTemplate,
    [fallbackTemplate, selectedTemplateId, templates],
  );

  const selectedCard = useMemo(
    () =>
      zones.flatMap((zone) => zone.cards).find((card) => card.id === selectedWidgetId) ?? zones[0]?.cards[0],
    [selectedWidgetId, zones],
  );

  const selectedZone = useMemo(
    () => zones.find((zone) => zone.cards.some((card) => card.id === selectedCard?.id)),
    [selectedCard?.id, zones],
  );

  const selectedTheme = useMemo(
    () => accentThemes.find((theme) => theme.label === themeKey) ?? accentThemes[0],
    [themeKey],
  );

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", selectedTheme.accent);
    document.documentElement.style.setProperty("--accent-strong", selectedTheme.accentStrong);
  }, [selectedTheme]);

  const previewState = previewHistory.state;
  const activePreviewReport = previewState.templateReports[selectedTemplateId] ?? selectedTemplate.previewReport;
  const hiddenCardIds = previewState.hiddenCardsByTemplate[selectedTemplateId] ?? [];
  const renderModes = previewState.renderModesByTemplate[selectedTemplateId] ?? {};
  const cardSizes = previewState.cardSizesByTemplate[selectedTemplateId] ?? {};
  const sectionThemes = previewState.sectionThemesByTemplate[selectedTemplateId] ?? {};

  function updatePreviewState(updater: (current: TemplatePreviewState) => TemplatePreviewState) {
    previewHistory.set(updater(previewState));
  }

  function updateSelectedCard(
    patch: Partial<ReportBuilderSnapshot["zones"][number]["cards"][number]>,
  ) {
    if (!selectedCard) return;

    setZones((currentZones) =>
      currentZones.map((zone) => ({
        ...zone,
        cards: zone.cards.map((card) => (card.id === selectedCard.id ? { ...card, ...patch } : card)),
      })),
    );
  }

  function handleSaveTemplate() {
    const finalLabel = templateName.trim() || `${resolvedSnapshot?.sectionLabel ?? "Custom"} custom ${templates.length + 1}`;
    const idBase = finalLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const id = `${idBase || "custom-template"}-${Date.now().toString().slice(-5)}`;

    const newTemplate = {
      ...selectedTemplate,
      id,
      label: finalLabel,
      description: `Saved from ${selectedTemplate.label}. Includes current executive preview customizations.`,
      previewReport: activePreviewReport,
    };

    setTemplates((current) => [...current, newTemplate]);
    updatePreviewState((current) => ({
      ...current,
      templateReports: { ...current.templateReports, [id]: activePreviewReport },
      hiddenCardsByTemplate: { ...current.hiddenCardsByTemplate, [id]: hiddenCardIds },
      renderModesByTemplate: { ...current.renderModesByTemplate, [id]: renderModes },
      cardSizesByTemplate: { ...current.cardSizesByTemplate, [id]: cardSizes },
      sectionThemesByTemplate: { ...current.sectionThemesByTemplate, [id]: sectionThemes },
    }));
    setSelectedTemplateId(id);
    setTemplateName("");
    setSaveNotice(`Saved as ${finalLabel}.`);
  }

  function addWidgetToBlock(blockKey: string, widgetType: NewWidgetType) {
    const report = activePreviewReport;
    const widgetId = `${blockKey}-${Date.now().toString().slice(-6)}`;
    const widget = createStoryCardFromWidgetKind(widgetType, { id: widgetId });

    updatePreviewState((current) => ({
      ...current,
      templateReports: {
        ...current.templateReports,
        [selectedTemplateId]: {
          ...report,
          storyBlocks: report.storyBlocks.map((block) =>
            block.key === blockKey
              ? {
                  ...block,
                  cards: [...block.cards, widget],
                }
              : block,
          ),
        },
      },
    }));
  }

  function addWidgetBundleToBlock(blockKey: string, bundleId: string) {
    const bundle = getWidgetBundle(bundleId);
    if (!bundle) return;

    const report = activePreviewReport;
    const bundleCards = bundle.widgetKinds.map((kind, index) =>
      createStoryCardFromWidgetKind(kind, {
        id: `${blockKey}-${bundle.id}-${kind}-${Date.now().toString().slice(-4)}-${index + 1}`,
      }),
    );

    updatePreviewState((current) => ({
      ...current,
      templateReports: {
        ...current.templateReports,
        [selectedTemplateId]: {
          ...report,
          storyBlocks: report.storyBlocks.map((block) =>
            block.key === blockKey ? { ...block, cards: [...block.cards, ...bundleCards] } : block,
          ),
        },
      },
    }));
  }

  function createTemplateFromReport(nextReport: ReportSnapshot, label: string, description: string) {
    const idBase = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const id = `${idBase || "report"}-${Date.now().toString().slice(-5)}`;
    const nextTemplate = {
      ...selectedTemplate,
      id,
      label,
      description,
      previewReport: nextReport,
    };

    setTemplates((current) => [...current, nextTemplate]);
    updatePreviewState((current) => ({
      ...current,
      templateReports: {
        ...current.templateReports,
        [id]: nextReport,
      },
      hiddenCardsByTemplate: {
        ...current.hiddenCardsByTemplate,
        [id]: [],
      },
      renderModesByTemplate: {
        ...current.renderModesByTemplate,
        [id]: {},
      },
      cardSizesByTemplate: {
        ...current.cardSizesByTemplate,
        [id]: {},
      },
      sectionThemesByTemplate: {
        ...current.sectionThemesByTemplate,
        [id]: {},
      },
    }));
    setSelectedTemplateId(id);
    setMode("preview");
    setCreateReportOpen(false);
  }

  function moveCardToBlock(cardId: string, targetBlockKey: string) {
    let movingCard: ReportSnapshot["storyBlocks"][number]["cards"][number] | null = null;

    const removed = activePreviewReport.storyBlocks.map((block) => ({
      ...block,
      cards: block.cards.filter((card) => {
        if (card.id === cardId) {
          movingCard = card;
          return false;
        }
        return true;
      }),
    }));

    if (!movingCard) return;

    updatePreviewState((current) => ({
      ...current,
      templateReports: {
        ...current.templateReports,
        [selectedTemplateId]: {
          ...activePreviewReport,
          storyBlocks: removed.map((block) =>
            block.key === targetBlockKey ? { ...block, cards: [...block.cards, movingCard!] } : block,
          ),
        },
      },
    }));
  }

  function moveSection(sourceKey: string, targetKey: string) {
    if (sourceKey === targetKey) return;

    const blocks = [...activePreviewReport.storyBlocks];
    const sourceIndex = blocks.findIndex((block) => block.key === sourceKey);
    const targetIndex = blocks.findIndex((block) => block.key === targetKey);

    if (sourceIndex < 0 || targetIndex < 0) return;

    const [moving] = blocks.splice(sourceIndex, 1);
    blocks.splice(targetIndex, 0, moving);

    updatePreviewState((current) => ({
      ...current,
      templateReports: {
        ...current.templateReports,
        [selectedTemplateId]: {
          ...activePreviewReport,
          storyBlocks: blocks,
        },
      },
    }));
  }

  function duplicateCard(cardId: string) {
    const report = activePreviewReport;
    const blockIndex = report.storyBlocks.findIndex((block) => block.cards.some((card) => card.id === cardId));
    if (blockIndex < 0) return;

    const sourceBlock = report.storyBlocks[blockIndex]!;
    const cardIndex = sourceBlock.cards.findIndex((card) => card.id === cardId);
    if (cardIndex < 0) return;

    const card = sourceBlock.cards[cardIndex]!;
    const cloneId = `${card.id}-copy-${Date.now().toString().slice(-4)}`;
    const clone = {
      ...card,
      id: cloneId,
      title: `${card.title} (Copy)`,
    };

    updatePreviewState((current) => ({
      ...current,
      templateReports: {
        ...current.templateReports,
        [selectedTemplateId]: {
          ...report,
          storyBlocks: report.storyBlocks.map((block, index) =>
            index === blockIndex
              ? {
                  ...block,
                  cards: [...block.cards.slice(0, cardIndex + 1), clone, ...block.cards.slice(cardIndex + 1)],
                }
              : block,
          ),
        },
      },
      renderModesByTemplate: {
        ...current.renderModesByTemplate,
        [selectedTemplateId]: {
          ...(current.renderModesByTemplate[selectedTemplateId] ?? {}),
          [cloneId]: (current.renderModesByTemplate[selectedTemplateId] ?? {})[card.id] ?? "card",
        },
      },
      cardSizesByTemplate: {
        ...current.cardSizesByTemplate,
        [selectedTemplateId]: {
          ...(current.cardSizesByTemplate[selectedTemplateId] ?? {}),
          [cloneId]: (current.cardSizesByTemplate[selectedTemplateId] ?? {})[card.id] ?? "medium",
        },
      },
    }));
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCommandOpenShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isCommandOpenShortcut) return;
      event.preventDefault();
      setCommandOpen(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const commandActions = useMemo<ExecutiveCommandPaletteAction[]>(
    () => [
      {
        id: "add-card",
        label: "Add narrative card to first section",
        description: "Insert a standard narrative block in the first story section.",
        shortcutHint: "A",
      },
      {
        id: "add-comparison",
        label: "Add comparison widget to first section",
        description: "Insert a +/− comparison card for quarter-over-quarter context.",
        shortcutHint: "C",
      },
      {
        id: "restore-subtracted",
        label: "Restore all subtracted items",
        description: "Bring back every hidden metric or card in this template preview.",
      },
      {
        id: "undo",
        label: "Undo",
        description: "Undo last preview edit.",
        shortcutHint: "Cmd/Ctrl+Z",
        disabled: !previewHistory.canUndo,
      },
      {
        id: "redo",
        label: "Redo",
        description: "Redo preview edit.",
        shortcutHint: "Cmd/Ctrl+Shift+Z",
        disabled: !previewHistory.canRedo,
      },
      {
        id: "switch-edit",
        label: "Switch to edit mode",
        description: "Open feed/mapping and setup mode.",
      },
    ],
    [previewHistory.canRedo, previewHistory.canUndo],
  );

  function handleCommandSelect(action: ExecutiveCommandPaletteAction) {
    if (action.disabled) return;

    if (action.id === "add-card") {
      const firstBlockKey = activePreviewReport.storyBlocks[0]?.key;
      if (firstBlockKey) addWidgetToBlock(firstBlockKey, "text_insight");
    } else if (action.id === "add-comparison") {
      const firstBlockKey = activePreviewReport.storyBlocks[0]?.key;
      if (firstBlockKey) addWidgetToBlock(firstBlockKey, "comparison");
    } else if (action.id === "restore-subtracted") {
      updatePreviewState((current) => ({
        ...current,
        hiddenCardsByTemplate: { ...current.hiddenCardsByTemplate, [selectedTemplateId]: [] },
      }));
    } else if (action.id === "undo") {
      previewHistory.undo();
    } else if (action.id === "redo") {
      previewHistory.redo();
    } else if (action.id === "switch-edit") {
      setMode("edit");
    }

    setCommandOpen(false);
    setCommandQuery("");
  }

  // ── DB-backed summary persistence ────────────────────────────────────────────
  function handleSummaryChange(newSummary: string) {
    if (!isDbBacked || !draftId) return;
    startTransition(async () => {
      await updateDraftSummary(draftId, newSummary);
    });
  }

  // ── DB-backed widget persistence ──────────────────────────────────────────────
  function persistWidgetAdd(zoneKey: string, widgetType: string, sortOrder: number) {
    if (!isDbBacked || !draftId) return;
    startTransition(async () => {
      await saveWidgetInstance(draftId, {
        widgetType,
        zoneKey,
        size: "medium",
        configJson: "{}",
        sortOrder,
        includeInRollup: false,
      });
    });
  }

  function persistWidgetDelete(widgetId: string) {
    if (!isDbBacked || !draftId) return;
    startTransition(async () => {
      await deleteWidgetInstance(widgetId);
    });
  }

  function persistWidgetUpdate(widgetId: string, patch: { size?: string; configJson?: string; sortOrder?: number; includeInRollup?: boolean; zoneKey?: string }) {
    if (!isDbBacked || !draftId) return;
    startTransition(async () => {
      await saveWidgetInstance(draftId, {
        id: widgetId,
        widgetType: "",
        zoneKey: patch.zoneKey ?? "",
        size: patch.size ?? "medium",
        configJson: patch.configJson ?? "{}",
        sortOrder: patch.sortOrder ?? 0,
        includeInRollup: patch.includeInRollup,
      });
    });
  }

  // Unused warning suppression — these are wired up via call sites below
  void persistWidgetDelete;
  void persistWidgetUpdate;
  void handleSummaryChange;

  const headerSnapshot: ReportBuilderSnapshot = resolvedSnapshot ?? {
    draftTitle: initialDraft?.title ?? "",
    sectionLabel: initialDraft?.section ?? "",
    periodLabel: "",
    selectedTemplateId: "",
    selectedWidgetId: "",
    templates: [],
    dataFeeds: [],
    workflowNotes: [],
    libraryGroups: [],
    zones: [],
    inspector: {
      widgetTitle: "",
      widgetType: "",
      narrativeGoal: "",
      supportingFields: [],
      controls: [],
    },
  };

  return (
    <div className="space-y-6">
      <BuilderSessionHeader
        snapshot={{ ...headerSnapshot, templates }}
        selectedTemplateId={selectedTemplateId}
        mode={mode}
        onSelectTemplate={setSelectedTemplateId}
        onSetMode={setMode}
        draftId={draftId ?? undefined}
        currentStatus={initialDraft?.status}
      />
      <SurfaceCard
        eyebrow="Template actions"
        title="Wider layout + editing controls"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={previewHistory.undo}
              disabled={!previewHistory.canUndo}
              aria-label="Undo preview change"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </button>
            <button
              type="button"
              onClick={previewHistory.redo}
              disabled={!previewHistory.canRedo}
              aria-label="Redo preview change"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Redo2 className="h-3.5 w-3.5" />
              Redo
            </button>
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="inline-flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
            >
              Cmd Palette
            </button>
            <button
              type="button"
              onClick={() => setCreateReportOpen(true)}
              className="inline-flex h-9 items-center rounded-full border border-[var(--accent)]/45 bg-[var(--accent)]/12 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--accent)]/2"
            >
              Create report
            </button>
          </div>
        }
      >
        <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr_0.8fr]">
          <label className="block space-y-1">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/45">
              Draft title
            </span>
            <input
              type="text"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              className="w-full rounded-[0.95rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
            />
          </label>
          <div className="flex gap-2">
            <label className="block flex-1 space-y-1">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/45">
                Save as template
              </span>
              <input
                type="text"
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                placeholder="Template name"
                className="w-full rounded-[0.95rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
              />
            </label>
            <button
              type="button"
              onClick={handleSaveTemplate}
              className="mt-[1.45rem] rounded-[0.95rem] border border-[var(--accent)]/45 bg-[var(--accent)]/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent)]/25"
            >
              Save
            </button>
          </div>
          <label className="block space-y-1">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/45">
              Accent color
            </span>
            <select
              value={themeKey}
              onChange={(event) => setThemeKey(event.target.value)}
              className="w-full rounded-[0.95rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
            >
              {accentThemes.map((theme) => (
                <option key={theme.label} value={theme.label}>
                  {theme.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {saveNotice ? <p className="mt-3 text-sm text-[var(--accent)]">{saveNotice}</p> : null}
      </SurfaceCard>

      {mode === "preview" ? (
        <div className="space-y-5">
          <SurfaceCard eyebrow="Template preview" title={`${selectedTemplate.label} executive artifact`}>
            {hiddenCardIds.length ? (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-[1rem] border border-white/10 bg-slate-950/55 px-4 py-3">
                <p className="text-sm text-slate-300">
                  {hiddenCardIds.length} item{hiddenCardIds.length > 1 ? "s" : ""} subtracted from this
                  preview.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    updatePreviewState((current) => ({
                      ...current,
                      hiddenCardsByTemplate: { ...current.hiddenCardsByTemplate, [selectedTemplateId]: [] },
                    }))
                  }
                  className="rounded-[0.85rem] border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                >
                  Restore all
                </button>
              </div>
            ) : null}
            <ExecutiveReadout
              snapshot={activePreviewReport}
              editable
              hiddenCardIds={hiddenCardIds}
              cardRenderModes={renderModes}
              onToggleCardVisibility={(cardId) =>
                updatePreviewState((current) => {
                  const existing = current.hiddenCardsByTemplate[selectedTemplateId] ?? [];
                  const next = existing.includes(cardId)
                    ? existing.filter((existingId) => existingId !== cardId)
                    : [...existing, cardId];
                  return {
                    ...current,
                    hiddenCardsByTemplate: { ...current.hiddenCardsByTemplate, [selectedTemplateId]: next },
                  };
                })
              }
              onEditCard={(cardId, patch) =>
                updatePreviewState((current) => {
                  const report = current.templateReports[selectedTemplateId] ?? selectedTemplate.previewReport;
                  return {
                    ...current,
                    templateReports: {
                      ...current.templateReports,
                      [selectedTemplateId]: {
                        ...report,
                        storyBlocks: report.storyBlocks.map((block) => ({
                          ...block,
                          cards: block.cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card)),
                        })),
                      },
                    },
                  };
                })
              }
              onEditCallout={(calloutIndex, patch) =>
                updatePreviewState((current) => {
                  const report = current.templateReports[selectedTemplateId] ?? selectedTemplate.previewReport;
                  return {
                    ...current,
                    templateReports: {
                      ...current.templateReports,
                      [selectedTemplateId]: {
                        ...report,
                        callouts: report.callouts.map((callout, index) =>
                          index === calloutIndex ? { ...callout, ...patch } : callout,
                        ),
                      },
                    },
                  };
                })
              }
              onSetCardRenderMode={(cardId, renderMode) =>
                updatePreviewState((current) => ({
                  ...current,
                  renderModesByTemplate: {
                    ...current.renderModesByTemplate,
                    [selectedTemplateId]: {
                      ...(current.renderModesByTemplate[selectedTemplateId] ?? {}),
                      [cardId]: renderMode,
                    },
                  },
                }))
              }
              onSetCardWidgetType={(cardId, widgetType) =>
                updatePreviewState((current) => {
                  const report = current.templateReports[selectedTemplateId] ?? selectedTemplate.previewReport;
                  return {
                    ...current,
                    templateReports: {
                      ...current.templateReports,
                      [selectedTemplateId]: {
                        ...report,
                        storyBlocks: report.storyBlocks.map((block) => ({
                          ...block,
                          cards: block.cards.map((card) =>
                            card.id === cardId ? { ...card, widgetType } : card,
                          ),
                        })),
                      },
                    },
                    renderModesByTemplate: {
                      ...current.renderModesByTemplate,
                      [selectedTemplateId]: {
                        ...(current.renderModesByTemplate[selectedTemplateId] ?? {}),
                        [cardId]: getWidgetDefinition(widgetType).defaultRenderMode,
                      },
                    },
                  };
                })
              }
              onSetCardSize={(cardId, size) =>
                updatePreviewState((current) => ({
                  ...current,
                  cardSizesByTemplate: {
                    ...current.cardSizesByTemplate,
                    [selectedTemplateId]: {
                      ...(current.cardSizesByTemplate[selectedTemplateId] ?? {}),
                      [cardId]: size,
                    },
                  },
                }))
              }
              onSetSectionTheme={(blockKey, theme) =>
                updatePreviewState((current) => ({
                  ...current,
                  sectionThemesByTemplate: {
                    ...current.sectionThemesByTemplate,
                    [selectedTemplateId]: {
                      ...(current.sectionThemesByTemplate[selectedTemplateId] ?? {}),
                      [blockKey]: theme,
                    },
                  },
                }))
              }
              onMoveCardToBlock={moveCardToBlock}
              onMoveSection={moveSection}
              onDuplicateCard={duplicateCard}
              favoriteWidgetKinds={favorites}
              onToggleWidgetFavorite={(widgetKind) =>
                setFavorites((current) =>
                  current.includes(widgetKind)
                    ? current.filter((kind) => kind !== widgetKind)
                    : [...current, widgetKind],
                )
              }
              onAddWidgetBundle={addWidgetBundleToBlock}
              cardSizes={cardSizes}
              sectionThemes={sectionThemes}
              onAddCard={addWidgetToBlock}
            />
          </SurfaceCard>
        </div>
      ) : resolvedSnapshot == null ? (
        <div className="flex items-center justify-center py-16 text-sm text-slate-400">
          Edit mode requires a template snapshot — switch to preview mode to edit this DB-backed draft.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.82fr_1.55fr_0.9fr]">
          <BuilderLibraryPanel snapshot={resolvedSnapshot} onSelectWidget={setSelectedWidgetId} />
          <BuilderCanvas
            periodLabel={resolvedSnapshot.periodLabel}
            draftTitle={draftTitle}
            zones={zones}
            selectedCardId={selectedCard?.id}
            onSelectCard={setSelectedWidgetId}
          />
          <BuilderInspector
            snapshot={resolvedSnapshot}
            selectedCard={selectedCard}
            selectedZoneTitle={selectedZone?.title}
            onUpdateSelectedCard={updateSelectedCard}
          />
        </div>
      )}

      <ExecutiveCommandPalette
        open={commandOpen}
        query={commandQuery}
        actions={commandActions}
        onQueryChange={setCommandQuery}
        onSelect={handleCommandSelect}
        onClose={() => {
          setCommandOpen(false);
          setCommandQuery("");
        }}
        title="Executive Builder Commands"
        subtitle="Fast actions for preview-first editing"
        keyboardHintText="Cmd/Ctrl+K to open"
      />

      <CreateReportModal
        open={createReportOpen}
        templates={templates.map((template) => ({ id: template.id, label: template.label }))}
        reportPresets={reportCreationPresets}
        onClose={() => setCreateReportOpen(false)}
        onCreateFromTemplate={(templateId, newReportLabel) => {
          const source = templates.find((template) => template.id === templateId);
          if (!source) return;
          createTemplateFromReport(
            {
              ...source.previewReport,
              reportTitle: newReportLabel || source.previewReport.reportTitle,
            },
            newReportLabel || `${source.label} copy`,
            `Created from template ${source.label}.`,
          );
        }}
        onCreateFromPreset={(presetId, newReportLabel) => {
          const nextReport = createReportFromPreset(
            presetId,
            selectedTemplate.previewReport,
            newReportLabel || "Preset report",
          );
          createTemplateFromReport(
            nextReport,
            newReportLabel || "Preset report",
            `Created from report preset ${presetId}.`,
          );
        }}
        onCreateCustom={(newReportLabel) => {
          const nextReport = createBlankReport(
            selectedTemplate.previewReport,
            newReportLabel || "Custom report",
          );
          createTemplateFromReport(
            nextReport,
            newReportLabel || "Custom report",
            "Created as blank custom report.",
          );
        }}
      />
    </div>
  );
}
