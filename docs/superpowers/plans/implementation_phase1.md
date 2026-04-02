# Phase 1 — Canva-Style Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Not started

**Goal:** Upgrade the report builder into a drag-and-drop canvas with a tabbed flywheel tray (Data Fields / Widgets / Templates) that replaces the existing QuickAddPopover.

**Architecture:** Install @dnd-kit for drag-and-drop. Add a pure `suggestWidgetKind()` utility driven by existing `fieldRole`/`fieldType` data. Replace `QuickAddPopover` with a `FlywheelTray` component that slides up above the `+` button. Wrap `BuilderCanvas` in a DnD context that handles three drop scenarios: reorder within zone, move between zones, and drop between zones to create a new zone.

**Tech Stack:** Next.js 16, React 19, TypeScript, @dnd-kit/core + @dnd-kit/sortable, Prisma (SQLite), Tailwind CSS 4, Framer Motion (already installed)

> **Note on testing:** No test framework is configured in this project. Each task includes a **Verify** step with browser-based confirmation steps instead of automated tests. If you add vitest later, the pure utility functions in `src/features/widgets/suggest.ts` are the best candidates for unit tests.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/features/widgets/suggest.ts` | Create | Pure function mapping fieldRole+fieldType → WidgetKind |
| `src/features/imports/field-suggestions-action.ts` | Create | Server action: fetch widget-eligible fields for a section |
| `src/components/reports/flywheel-tray/flywheel-tray.tsx` | Create | Tray container: anchor button, slide-up panel, tab switcher |
| `src/components/reports/flywheel-tray/data-fields-tab.tsx` | Create | Lists FieldRegistryEntry rows with suggested widget labels |
| `src/components/reports/flywheel-tray/widgets-tab.tsx` | Create | Blank widget kind picker (mirrors existing quick-add palette) |
| `src/components/reports/flywheel-tray/templates-tab.tsx` | Create | Lists reportCreationPresets, click to populate draft |
| `src/features/reports/actions.ts` | Modify | Add `bulkUpdateWidgetPositions` server action |
| `src/components/reports/builder-canvas.tsx` | Modify | Wrap zones/cards in @dnd-kit droppable/sortable, add between-zone drop targets |
| `src/components/reports/report-builder-workspace.tsx` | Modify | Replace QuickAddPopover with FlywheelTray, wire DnD handlers |
| `src/components/reports/executive-readout/quick-add-popover.tsx` | Modify | Keep file, but remove the `onMoreOptions` path (now handled by tray) |

---

## Task 1: Install @dnd-kit

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected output: 3 packages added, no peer-dep warnings.

- [ ] **Step 2: Verify TypeScript types are available**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors related to dnd-kit.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @dnd-kit/core, sortable, utilities"
```

---

## Task 2: Widget suggestion utility

**Files:**
- Create: `src/features/widgets/suggest.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/features/widgets/suggest.ts
//
// Pure function: given a fieldRole and fieldType from FieldRegistryEntry,
// return the most appropriate WidgetKind to suggest in the flywheel tray.

import type { WidgetKind } from "./types";

type FieldRole =
  | "kpi"
  | "evidence"
  | "takeaway"
  | "highlightFlag"
  | "classification"
  | "dimension"
  | "metric"
  | "note"
  | "ignored";

type FieldType =
  | "number"
  | "percent"
  | "currency"
  | "text"
  | "date"
  | "status"
  | "tag"
  | "link"
  | "boolean";

/**
 * Returns the suggested WidgetKind for a field based on its role and type.
 * Falls back to "text_insight" when no strong signal is present.
 */
export function suggestWidgetKind(
  fieldRole: FieldRole,
  fieldType: FieldType
): WidgetKind {
  if (fieldRole === "kpi") {
    if (fieldType === "number" || fieldType === "currency" || fieldType === "percent") {
      return "kpi_stat";
    }
    return "kpi_stat";
  }

  if (fieldRole === "metric") {
    if (fieldType === "date") return "time_series";
    if (fieldType === "number" || fieldType === "currency" || fieldType === "percent") {
      return "sparkline";
    }
    return "kpi_stat";
  }

  if (fieldRole === "dimension") {
    return "ranked_bar";
  }

  if (fieldRole === "takeaway") {
    return "text_insight";
  }

  if (fieldRole === "highlightFlag" || fieldRole === "classification") {
    return "callout";
  }

  if (fieldRole === "evidence") {
    return "table";
  }

  if (fieldRole === "note") {
    return "text_insight";
  }

  // "ignored" and unknown roles — caller should not show these in the tray
  return "text_insight";
}

/**
 * Returns a human-readable label for the suggested widget.
 * Used in the flywheel tray "→ Suggested: X" display.
 */
export function suggestWidgetLabel(
  fieldRole: FieldRole,
  fieldType: FieldType
): string {
  const kind = suggestWidgetKind(fieldRole, fieldType);
  const labels: Record<WidgetKind, string> = {
    kpi_stat: "KPI Card",
    sparkline: "Sparkline",
    time_series: "Line Chart",
    ranked_bar: "Bar Chart",
    table: "Table",
    text_insight: "Narrative Block",
    callout: "Callout",
    timeline: "Timeline",
    comparison: "Comparison",
    quote: "Quote",
  };
  return labels[kind] ?? "Widget";
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | grep "suggest"
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/features/widgets/suggest.ts
git commit -m "feat: add suggestWidgetKind utility for flywheel tray"
```

---

## Task 3: Server action — fetch field suggestions for a section

**Files:**
- Create: `src/features/imports/field-suggestions-action.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/features/imports/field-suggestions-action.ts
"use server";

import { listWidgetEligibleFields } from "@/lib/db/fieldRegistry";
import { requireWhitelisted } from "@/features/auth/session";
import { suggestWidgetKind, suggestWidgetLabel } from "@/features/widgets/suggest";
import type { WidgetKind } from "@/features/widgets/types";

export type FieldSuggestion = {
  id: string;
  internalKey: string;
  displayLabel: string;
  fieldRole: string;
  fieldType: string;
  suggestedWidgetKind: WidgetKind;
  suggestedWidgetLabel: string;
};

/**
 * Returns all widget-eligible fields for a section, each annotated with
 * a suggested widget kind derived from fieldRole + fieldType.
 * Used by the FlywheelTray Data Fields tab.
 */
export async function getFieldSuggestionsForSection(
  section: string
): Promise<FieldSuggestion[]> {
  await requireWhitelisted();

  const entries = await listWidgetEligibleFields(section);

  return entries.map((entry) => ({
    id: entry.id,
    internalKey: entry.internalKey,
    displayLabel: entry.displayLabel,
    fieldRole: entry.fieldRole,
    fieldType: entry.fieldType,
    suggestedWidgetKind: suggestWidgetKind(
      entry.fieldRole as Parameters<typeof suggestWidgetKind>[0],
      entry.fieldType as Parameters<typeof suggestWidgetKind>[1]
    ),
    suggestedWidgetLabel: suggestWidgetLabel(
      entry.fieldRole as Parameters<typeof suggestWidgetLabel>[0],
      entry.fieldType as Parameters<typeof suggestWidgetLabel>[1]
    ),
  }));
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | grep "field-suggestions"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/features/imports/field-suggestions-action.ts
git commit -m "feat: add getFieldSuggestionsForSection server action"
```

---

## Task 4: Bulk widget position server action

**Files:**
- Modify: `src/features/reports/actions.ts`

- [ ] **Step 1: Add `bulkUpdateWidgetPositions` to the bottom of `actions.ts`**

Open `src/features/reports/actions.ts` and append:

```typescript
export type WidgetPositionUpdate = {
  id: string;
  zoneKey: string;
  sortOrder: number;
};

/**
 * Bulk-update zoneKey and sortOrder for multiple widgets.
 * Called after a drag-and-drop operation resolves on the canvas.
 */
export async function bulkUpdateWidgetPositions(
  draftId: string,
  updates: WidgetPositionUpdate[]
): Promise<void> {
  await requireWhitelisted();

  // Fire all updates in parallel — each is a single-row write
  await Promise.all(
    updates.map((u) =>
      updateWidget(u.id, { zoneKey: u.zoneKey, sortOrder: u.sortOrder })
    )
  );

  logAuditEvent({
    action: "draft.widgets_reordered",
    entityType: "ReportDraft",
    entityId: draftId,
    meta: { count: updates.length },
  }).catch(() => {});
}
```

You also need to import `updateWidget` — it's already imported in the file. Confirm it appears in the existing imports block at the top:

```typescript
import {
  // ... existing imports ...
  updateWidget,
  // ...
} from "@/lib/db/reportDrafts";
```

If `updateWidget` is not already imported, add it.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/reports/actions.ts
git commit -m "feat: add bulkUpdateWidgetPositions server action"
```

---

## Task 5: FlywheelTray — DataFieldsTab

**Files:**
- Create: `src/components/reports/flywheel-tray/data-fields-tab.tsx`

- [ ] **Step 1: Create the file**

```typescript
// src/components/reports/flywheel-tray/data-fields-tab.tsx
"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { FieldSuggestion } from "@/features/imports/field-suggestions-action";
import type { WidgetKind } from "@/features/widgets/types";

type DataFieldsTabProps = {
  fields: FieldSuggestion[];
  section: string;
};

type DraggableFieldProps = {
  field: FieldSuggestion;
};

function DraggableField({ field }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-${field.id}`,
    data: {
      type: "field",
      fieldId: field.id,
      widgetKind: field.suggestedWidgetKind as WidgetKind,
      displayLabel: field.displayLabel,
      fieldRole: field.fieldRole,
      internalKey: field.internalKey,
    },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-[0.85rem] border border-white/10 bg-slate-950/60 px-3 py-2.5 active:cursor-grabbing"
    >
      <p className="text-[0.65rem] uppercase tracking-[0.14em] text-white/35">
        {field.fieldRole} · {field.fieldType}
      </p>
      <p className="mt-0.5 text-sm font-medium text-white">{field.displayLabel}</p>
      <p className="mt-1 text-[0.68rem] text-[var(--accent)]">
        → {field.suggestedWidgetLabel}
      </p>
    </div>
  );
}

export function DataFieldsTab({ fields, section }: DataFieldsTabProps) {
  if (fields.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
        <p className="text-sm text-white/40">No mapped fields yet</p>
        <p className="text-xs text-white/25">
          Import a CSV for <span className="text-white/40">{section}</span> and map field
          roles to see suggestions here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      {fields.map((field) => (
        <DraggableField key={field.id} field={field} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | grep "data-fields"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/reports/flywheel-tray/data-fields-tab.tsx
git commit -m "feat: add DataFieldsTab with draggable field items"
```

---

## Task 6: FlywheelTray — WidgetsTab

**Files:**
- Create: `src/components/reports/flywheel-tray/widgets-tab.tsx`

- [ ] **Step 1: Create the file**

```typescript
// src/components/reports/flywheel-tray/widgets-tab.tsx
"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { widgetDefinitions } from "@/features/widgets/registry";
import type { WidgetKind } from "@/features/widgets/types";

type WidgetsTabProps = {
  onAddBlank: (kind: WidgetKind) => void;
};

type DraggableWidgetKindProps = {
  kind: WidgetKind;
  label: string;
  layer: string;
};

function DraggableWidgetKind({ kind, label, layer }: DraggableWidgetKindProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `widget-kind-${kind}`,
    data: {
      type: "widget-kind",
      widgetKind: kind,
      displayLabel: label,
    },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-[0.85rem] border border-white/10 bg-slate-950/60 px-3 py-2.5 active:cursor-grabbing"
    >
      <p className="text-[0.65rem] uppercase tracking-[0.14em] text-white/35">{layer}</p>
      <p className="mt-0.5 text-sm font-medium text-white">{label}</p>
    </div>
  );
}

export function WidgetsTab({ onAddBlank }: WidgetsTabProps) {
  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      {widgetDefinitions.map((def) => (
        <DraggableWidgetKind
          key={def.kind}
          kind={def.kind}
          label={def.label}
          layer={def.layer}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | grep "widgets-tab"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/reports/flywheel-tray/widgets-tab.tsx
git commit -m "feat: add WidgetsTab with draggable widget kind items"
```

---

## Task 7: FlywheelTray — TemplatesTab

**Files:**
- Create: `src/components/reports/flywheel-tray/templates-tab.tsx`

- [ ] **Step 1: Create the file**

```typescript
// src/components/reports/flywheel-tray/templates-tab.tsx
"use client";

import { reportCreationPresets } from "@/features/reports/report-presets";
import type { ReportCreationPreset } from "@/features/reports/report-presets";

type TemplatesTabProps = {
  onApplyPreset: (presetId: string) => void;
};

export function TemplatesTab({ onApplyPreset }: TemplatesTabProps) {
  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      {reportCreationPresets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onApplyPreset(preset.id)}
          className="rounded-[0.85rem] border border-white/10 bg-slate-950/60 px-3 py-2.5 text-left transition hover:border-[var(--accent)]/30"
        >
          <p className="text-sm font-medium text-white">{preset.label}</p>
          <p className="mt-0.5 text-xs text-white/45">{preset.description}</p>
          <p className="mt-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--accent)]">
            {Object.values(preset.blockPlan).flat().length} widgets
          </p>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | grep "templates-tab"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/reports/flywheel-tray/templates-tab.tsx
git commit -m "feat: add TemplatesTab listing report creation presets"
```

---

## Task 8: FlywheelTray — main container

**Files:**
- Create: `src/components/reports/flywheel-tray/flywheel-tray.tsx`

- [ ] **Step 1: Create the file**

```typescript
// src/components/reports/flywheel-tray/flywheel-tray.tsx
"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { DataFieldsTab } from "./data-fields-tab";
import { WidgetsTab } from "./widgets-tab";
import { TemplatesTab } from "./templates-tab";
import type { FieldSuggestion } from "@/features/imports/field-suggestions-action";
import type { WidgetKind } from "@/features/widgets/types";

type Tab = "data" | "widgets" | "templates";

type FlywheelTrayProps = {
  section: string;
  fields: FieldSuggestion[];
  onAddBlankWidget: (kind: WidgetKind) => void;
  onApplyPreset: (presetId: string) => void;
};

export function FlywheelTray({
  section,
  fields,
  onAddBlankWidget,
  onApplyPreset,
}: FlywheelTrayProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("data");

  const tabs: { id: Tab; label: string }[] = [
    { id: "data", label: "Data Fields" },
    { id: "widgets", label: "Widgets" },
    { id: "templates", label: "Templates" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Tray panel — slides up above the button */}
      {open && (
        <>
          {/* Backdrop dismiss */}
          <button
            type="button"
            aria-label="Close tray"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-transparent"
          />
          <div className="relative z-40 flex h-[420px] w-[280px] flex-col overflow-hidden rounded-[1.25rem] border border-white/15 bg-[#0d1525] shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
            {/* Tab bar */}
            <div className="flex flex-shrink-0 border-b border-white/10">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 text-[0.67rem] font-semibold uppercase tracking-[0.12em] transition ${
                    activeTab === tab.id
                      ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content — scrollable */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "data" && (
                <DataFieldsTab fields={fields} section={section} />
              )}
              {activeTab === "widgets" && (
                <WidgetsTab onAddBlank={onAddBlankWidget} />
              )}
              {activeTab === "templates" && (
                <TemplatesTab onApplyPreset={onApplyPreset} />
              )}
            </div>
          </div>
        </>
      )}

      {/* Trigger button */}
      <button
        type="button"
        aria-label={open ? "Close tray" : "Open add tray"}
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] shadow-[0_8px_24px_rgba(242,141,73,0.4)] transition hover:opacity-90 active:scale-95"
      >
        {open ? (
          <X className="h-5 w-5 text-white" />
        ) : (
          <Plus className="h-5 w-5 text-white" />
        )}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | grep "flywheel"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/reports/flywheel-tray/
git commit -m "feat: add FlywheelTray component with Data/Widgets/Templates tabs"
```

---

## Task 9: Add DnD to BuilderCanvas

**Files:**
- Modify: `src/components/reports/builder-canvas.tsx`

This replaces the existing `BuilderCanvas` with a version that:
1. Wraps each zone in a `useDroppable` target
2. Wraps each card in `useSortable`
3. Adds between-zone drop targets (visible as dashed dividers on drag)

- [ ] **Step 1: Rewrite `builder-canvas.tsx`**

```typescript
// src/components/reports/builder-canvas.tsx
"use client";

import { Grip } from "lucide-react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { ReportBuilderSnapshot } from "@/features/reports/types";

// ── Between-zone drop target ─────────────────────────────────────────────────

type BetweenZoneDropProps = {
  id: string; // e.g. "between-header-summary-and-where-we-started"
  isOver: boolean;
};

function BetweenZoneDrop({ id, isOver }: BetweenZoneDropProps) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`mx-2 my-1 h-6 rounded-lg border-2 border-dashed transition-colors ${
        isOver ? "border-[var(--accent)]/60 bg-[var(--accent)]/5" : "border-white/5"
      }`}
    />
  );
}

// ── Sortable card ─────────────────────────────────────────────────────────────

type SortableCardProps = {
  card: ReportBuilderSnapshot["zones"][number]["cards"][number];
  isSelected: boolean;
  onSelect: (id: string) => void;
};

function SortableCard({ card, isSelected, onSelect }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <button
        type="button"
        onClick={() => onSelect(card.id)}
        className={`w-full rounded-[1.25rem] border px-4 py-4 text-left transition ${
          isSelected
            ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 shadow-[0_0_0_1px_rgba(242,141,73,0.14)]"
            : "border-white/10 bg-white/5 hover:bg-white/10"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab rounded-xl border border-white/10 bg-slate-950/45 p-2.5 active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
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
            </div>
          </div>
          <div className="space-y-2 text-right">
            <p className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-white/45">
              {card.size}
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              {card.status}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

// ── Droppable zone ────────────────────────────────────────────────────────────

type DroppableZoneProps = {
  zone: ReportBuilderSnapshot["zones"][number];
  selectedCardId?: string;
  onSelectCard: (id: string) => void;
  overZoneId: string | null;
};

function DroppableZone({ zone, selectedCardId, onSelectCard, overZoneId }: DroppableZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `zone-${zone.key}` });
  const cardIds = zone.cards.map((c) => c.id);

  return (
    <section
      ref={setNodeRef}
      className={`rounded-[1.55rem] border px-5 py-5 transition-colors ${
        isOver ? "border-[var(--accent)]/30 bg-[var(--accent)]/5" : "border-white/10 bg-slate-950/40"
      }`}
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

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="mt-4 grid gap-3">
          {zone.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              isSelected={card.id === selectedCardId}
              onSelect={onSelectCard}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

// ── BuilderCanvas ─────────────────────────────────────────────────────────────

type BuilderCanvasProps = {
  draftTitle: string;
  periodLabel: string;
  zones: ReportBuilderSnapshot["zones"];
  selectedCardId?: string;
  overZoneId: string | null;
  onSelectCard: (id: string) => void;
};

export function BuilderCanvas({
  draftTitle,
  periodLabel,
  zones,
  selectedCardId,
  overZoneId,
  onSelectCard,
}: BuilderCanvasProps) {
  return (
    <SurfaceCard eyebrow={periodLabel} title={draftTitle}>
      <div className="space-y-1">
        {zones.map((zone, index) => (
          <div key={zone.key}>
            {/* Between-zone drop target (before first zone too) */}
            {index === 0 && (
              <BetweenZoneDrop
                id={`between-start-and-${zone.key}`}
                isOver={overZoneId === `between-start-and-${zone.key}`}
              />
            )}

            <DroppableZone
              zone={zone}
              selectedCardId={selectedCardId}
              onSelectCard={onSelectCard}
              overZoneId={overZoneId}
            />

            {/* Between-zone drop target after each zone */}
            <BetweenZoneDrop
              id={`between-${zone.key}-and-${zones[index + 1]?.key ?? "end"}`}
              isOver={
                overZoneId ===
                `between-${zone.key}-and-${zones[index + 1]?.key ?? "end"}`
              }
            />
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/reports/builder-canvas.tsx
git commit -m "feat: add DnD drop zones and sortable cards to BuilderCanvas"
```

---

## Task 10: Wire DnD + FlywheelTray into ReportBuilderWorkspace

**Files:**
- Modify: `src/components/reports/report-builder-workspace.tsx`

This is the most involved task. The workspace needs to:
1. Wrap the canvas in `DndContext`
2. Handle `onDragStart`, `onDragOver`, `onDragEnd`
3. Load field suggestions on mount
4. Render `FlywheelTray` instead of (or alongside) `QuickAddPopover`
5. On drop: update `zones` state locally, then call `bulkUpdateWidgetPositions`

- [ ] **Step 1: Add imports at the top of `report-builder-workspace.tsx`**

Add these imports (keep all existing imports):

```typescript
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { FlywheelTray } from "./flywheel-tray/flywheel-tray";
import { getFieldSuggestionsForSection } from "@/features/imports/field-suggestions-action";
import { bulkUpdateWidgetPositions, type WidgetPositionUpdate } from "@/features/reports/actions";
import type { FieldSuggestion } from "@/features/imports/field-suggestions-action";
```

- [ ] **Step 2: Add state and effects inside `ReportBuilderWorkspace` (after existing state declarations)**

```typescript
const [fieldSuggestions, setFieldSuggestions] = useState<FieldSuggestion[]>([]);
const [activeDragId, setActiveDragId] = useState<string | null>(null);
const [overZoneId, setOverZoneId] = useState<string | null>(null);

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
);

// Load field suggestions whenever the section changes
const draftSection = initialDraft?.section ?? resolvedSnapshot?.sectionLabel?.toLowerCase() ?? "";
useEffect(() => {
  if (!draftSection) return;
  getFieldSuggestionsForSection(draftSection).then(setFieldSuggestions).catch(() => {});
}, [draftSection]);
```

- [ ] **Step 3: Add DnD event handlers inside `ReportBuilderWorkspace` (after the useEffect)**

```typescript
function handleDragStart(event: DragStartEvent) {
  setActiveDragId(String(event.active.id));
}

function handleDragOver(event: DragOverEvent) {
  const overId = event.over?.id ? String(event.over.id) : null;
  setOverZoneId(overId);
}

function handleDragEnd(event: DragEndEvent) {
  setActiveDragId(null);
  setOverZoneId(null);

  const { active, over } = event;
  if (!over || !draftId) return;

  const activeId = String(active.id);
  const overId = String(over.id);

  // Reorder within same zone
  const sourceZone = zones.find((z) => z.cards.some((c) => c.id === activeId));
  const targetZone = zones.find(
    (z) => z.key === overId.replace("zone-", "") || z.cards.some((c) => c.id === overId)
  );

  if (!sourceZone) return;

  if (sourceZone === targetZone || (targetZone && overId.startsWith("zone-"))) {
    // Same zone reorder OR drop onto a different zone
    const resolvedTargetZone = overId.startsWith("zone-")
      ? zones.find((z) => `zone-${z.key}` === overId)
      : targetZone;

    if (!resolvedTargetZone) return;

    if (sourceZone.key === resolvedTargetZone.key) {
      // Reorder within zone
      const oldIndex = sourceZone.cards.findIndex((c) => c.id === activeId);
      const newIndex = sourceZone.cards.findIndex((c) => c.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(sourceZone.cards, oldIndex, newIndex);
      setZones((prev) =>
        prev.map((z) => (z.key === sourceZone.key ? { ...z, cards: reordered } : z))
      );

      const updates: WidgetPositionUpdate[] = reordered.map((card, idx) => ({
        id: card.id,
        zoneKey: sourceZone.key,
        sortOrder: idx,
      }));
      bulkUpdateWidgetPositions(draftId, updates).catch(console.error);
    } else {
      // Move card to a different zone
      const movingCard = sourceZone.cards.find((c) => c.id === activeId);
      if (!movingCard) return;

      const newSourceCards = sourceZone.cards.filter((c) => c.id !== activeId);
      const newTargetCards = [...resolvedTargetZone.cards, movingCard];

      setZones((prev) =>
        prev.map((z) => {
          if (z.key === sourceZone.key) return { ...z, cards: newSourceCards };
          if (z.key === resolvedTargetZone.key) return { ...z, cards: newTargetCards };
          return z;
        })
      );

      const updates: WidgetPositionUpdate[] = [
        ...newSourceCards.map((c, i) => ({ id: c.id, zoneKey: sourceZone.key, sortOrder: i })),
        ...newTargetCards.map((c, i) => ({ id: c.id, zoneKey: resolvedTargetZone.key, sortOrder: i })),
      ];
      bulkUpdateWidgetPositions(draftId, updates).catch(console.error);
    }
  }
}
```

- [ ] **Step 4: Find the JSX return block and wrap the `BuilderCanvas` in `DndContext`**

In the `return (...)` block, find where `<BuilderCanvas .../>` is rendered and wrap it:

```tsx
<DndContext
  sensors={sensors}
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
>
  <BuilderCanvas
    draftTitle={draftTitle}
    periodLabel={/* existing prop */}
    zones={zones}
    selectedCardId={selectedWidgetId}
    overZoneId={overZoneId}
    onSelectCard={setSelectedWidgetId}
  />
</DndContext>
```

- [ ] **Step 5: Add `FlywheelTray` to the return block**

In the return block, add `FlywheelTray` as a sibling to the canvas (it renders fixed-positioned, so placement in JSX tree doesn't matter visually):

```tsx
<FlywheelTray
  section={draftSection}
  fields={fieldSuggestions}
  onAddBlankWidget={(kind) => {
    // Reuse existing add-card logic from the workspace
    const targetZoneKey = zones[0]?.key ?? "header-summary";
    if (draftId) {
      // Call existing handleAddCard pattern from the workspace
      // (adapt to whichever handler already adds a widget to a zone)
    }
  }}
  onApplyPreset={(presetId) => {
    // Reuse existing createReportFromPreset pattern
  }}
/>
```

> **Note:** The exact wiring of `onAddBlankWidget` and `onApplyPreset` depends on which handlers already exist in `ReportBuilderWorkspace`. Look for `handleAddCard` / `onAddCard` / `createReportFromPreset` calls in the existing workspace code and route through the same path. Do not duplicate the add-widget logic.

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -15
```

Expected: no errors.

- [ ] **Step 7: Verify in browser**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npm run dev
```

1. Open a report draft at `/admin/reports/[draftId]`
2. Confirm the `+` button renders in the bottom-right corner
3. Click `+` — the tray should slide up with three tabs
4. Click "Data Fields" tab — if the section has mapped fields, they appear. If not, the empty state shows.
5. Click "Widgets" tab — all 10 widget kinds appear as draggable items
6. Click "Templates" tab — existing presets appear
7. Drag a card's grip handle up/down within a zone — cards reorder
8. Check DB: open Prisma Studio (`npx prisma studio`) and verify `sortOrder` updated on `WidgetInstance`

- [ ] **Step 8: Commit**

```bash
git add src/components/reports/report-builder-workspace.tsx
git commit -m "feat: wire DnD context and FlywheelTray into ReportBuilderWorkspace"
```

---

## Task 11: Handle field drag drop onto canvas

**Files:**
- Modify: `src/components/reports/report-builder-workspace.tsx`

When a `FieldSuggestion` item is dragged from the tray and dropped on a zone, create a new `WidgetInstance`.

- [ ] **Step 1: Update `handleDragEnd` to handle field drops**

Inside the existing `handleDragEnd`, after the early return for `!over || !draftId`, add:

```typescript
// Field dragged from tray onto a zone
const dragData = active.data.current;
if (dragData?.type === "field" || dragData?.type === "widget-kind") {
  const widgetKind = dragData.widgetKind as WidgetKind;
  const displayLabel = dragData.displayLabel as string;

  // Determine target zone
  let targetZoneKey = zones[0]?.key ?? "header-summary";
  if (overId.startsWith("zone-")) {
    targetZoneKey = overId.replace("zone-", "");
  } else if (overId.startsWith("between-")) {
    // Use the zone after the between target, or last zone
    const parts = overId.split("-and-");
    targetZoneKey = parts[1] !== "end" ? parts[1] : (zones[zones.length - 1]?.key ?? targetZoneKey);
  }

  const targetZone = zones.find((z) => z.key === targetZoneKey);
  const sortOrder = targetZone ? targetZone.cards.length : 0;

  // Optimistically add to local state
  const tempId = `temp-${Date.now()}`;
  const newCard = {
    id: tempId,
    widgetType: widgetKind,
    title: displayLabel,
    source: dragData.internalKey ?? "",
    size: "medium" as const,
    includeInRollup: false,
    status: "draft-only" as const,
  };

  setZones((prev) =>
    prev.map((z) =>
      z.key === targetZoneKey ? { ...z, cards: [...z.cards, newCard] } : z
    )
  );

  // Persist to DB
  saveWidgetInstance(draftId, {
    widgetType: widgetKind,
    zoneKey: targetZoneKey,
    size: "medium",
    configJson: JSON.stringify({ sourceField: dragData.internalKey ?? null }),
    sortOrder,
    includeInRollup: false,
  })
    .then((saved) => {
      // Replace temp id with real db id
      setZones((prev) =>
        prev.map((z) => ({
          ...z,
          cards: z.cards.map((c) => (c.id === tempId ? { ...c, id: saved.id } : c)),
        }))
      );
    })
    .catch(console.error);

  return;
}
```

Make sure `saveWidgetInstance` is already imported — it comes from `@/features/reports/actions` and should already be in scope in the workspace.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Verify in browser**

1. Open `/admin/reports/[draftId]`
2. Open the flywheel tray → Data Fields tab
3. Drag a field onto a zone — a new widget card should appear
4. Refresh the page — the widget should persist (confirming DB write)
5. Drag from Widgets tab → same result with a blank widget

- [ ] **Step 4: Commit**

```bash
git add src/components/reports/report-builder-workspace.tsx
git commit -m "feat: handle field and widget-kind drag drops onto canvas zones"
```

---

## Task 12: Remove stale QuickAddPopover dependency

**Files:**
- Modify: `src/components/reports/report-builder-workspace.tsx`
- Modify: `src/components/reports/executive-readout/quick-add-popover.tsx` (optional cleanup)

- [ ] **Step 1: Remove the QuickAddPopover import and usage from `report-builder-workspace.tsx`**

Find all references to `QuickAddPopover`, `setAddBlockKey`, and the quick-add open state in `report-builder-workspace.tsx`. Remove them — the flywheel tray replaces this functionality.

- [ ] **Step 2: Verify TypeScript compiles with no unused-variable errors**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 3: Check the app builds**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npm run build 2>&1 | tail -20
```

Expected: no errors, no "unused import" warnings that would block the build.

- [ ] **Step 4: Commit**

```bash
git add src/components/reports/report-builder-workspace.tsx
git commit -m "chore: remove QuickAddPopover — replaced by FlywheelTray"
```

---

## Phase 1 Done ✓

At this point the following should work end-to-end:
- `+` button opens flywheel tray with Data Fields / Widgets / Templates tabs
- Data Fields tab shows registry fields with widget suggestions
- Dragging a field onto a zone creates and persists a new WidgetInstance
- Dragging a widget's grip handle reorders within a zone (persisted)
- Dragging between zones moves the widget (persisted)
- Templates tab lists presets and applies them on click

Mark this doc status as `Completed` and move to `implementation_phase2.md`.
