# Phase 2 — Form Layout Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Not started — begin after Phase 1 is complete

**Goal:** Add a three-layer preset system: view mode toggles per report, section-specific default widget arrangements, and persistable template starters with save-as-template.

**Architecture:** View modes are stored as a new `viewMode` field on `ReportDraft` (Prisma migration). Section defaults live in `src/config/sections.ts`. Templates are persisted via a new `ReportTemplate` Prisma model. The Templates tab in the Phase 1 FlywheelTray is updated to load from both built-in presets and DB templates.

**Tech Stack:** Next.js 16, React 19, TypeScript, Prisma (SQLite), Tailwind CSS 4

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `prisma/schema.prisma` | Modify | Add `viewMode` to `ReportDraft`, add `ReportTemplate` model |
| `prisma/migrations/...` | Create | Migration for above schema changes |
| `src/config/sections.ts` | Modify | Add `defaultViewMode` and `defaultWidgets` per section |
| `src/features/reports/view-mode.ts` | Create | `ViewMode` type and display helpers |
| `src/lib/db/reportTemplates.ts` | Create | DB functions for ReportTemplate CRUD |
| `src/features/reports/template-actions.ts` | Create | Server actions: saveAsTemplate, listTemplates |
| `src/features/reports/actions.ts` | Modify | Update `createReportDraft` to apply section defaults |
| `src/components/reports/builder-session-header.tsx` | Modify | Add view mode toggle |
| `src/components/reports/flywheel-tray/templates-tab.tsx` | Modify | Load DB templates alongside built-in presets |
| `src/app/admin/reports/[draftId]/page.tsx` | Modify | Pass viewMode to readout |

---

## Task 1: Schema — add viewMode to ReportDraft, add ReportTemplate model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `ViewMode` enum and update `ReportDraft`**

Open `prisma/schema.prisma`. After the existing enums, add:

```prisma
enum ViewMode {
  kpi_first
  chart_first
  narrative_heavy
}
```

In the `ReportDraft` model, add the `viewMode` field (with a default so existing rows are not broken):

```prisma
model ReportDraft {
  // ... existing fields ...
  viewMode        ViewMode        @default(kpi_first)
  // ... rest of existing fields ...
}
```

- [ ] **Step 2: Add the `ReportTemplate` model**

Append to `prisma/schema.prisma`:

```prisma
model ReportTemplate {
  id              String    @id @default(cuid())
  label           String
  description     String?
  section         String?   // null = generic (all sections)
  blockPlanJson   String    // JSON: Record<zoneKey, WidgetKind[]>
  isBuiltIn       Boolean   @default(false)
  createdByUserId String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdByUser   User?     @relation(fields: [createdByUserId], references: [id], onDelete: SetNull)
}
```

Also add the reverse relation on `User`:

```prisma
model User {
  // ... existing fields ...
  reportTemplates ReportTemplate[]
}
```

- [ ] **Step 3: Run migration**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting
npx prisma migrate dev --name add_view_mode_and_report_templates
```

Expected output: `✔ Your database is now in sync with your schema.`

- [ ] **Step 4: Regenerate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add ViewMode to ReportDraft and ReportTemplate model"
```

---

## Task 2: ViewMode type and helpers

**Files:**
- Create: `src/features/reports/view-mode.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/features/reports/view-mode.ts
// NOTE: Prisma also generates a `ViewMode` enum from the schema.
// This local type mirrors those values for use in UI components
// that don't want to import from @prisma/client directly.
// When passing to Prisma queries, cast with `as import('@prisma/client').ViewMode`.

export type ViewMode = "kpi_first" | "chart_first" | "narrative_heavy";

export const VIEW_MODE_OPTIONS: Array<{ value: ViewMode; label: string; description: string }> = [
  {
    value: "kpi_first",
    label: "Compact / KPI-first",
    description: "Numbers lead. Charts secondary. Dense, scannable.",
  },
  {
    value: "chart_first",
    label: "Chart-first",
    description: "Visual story first. Good for trend data.",
  },
  {
    value: "narrative_heavy",
    label: "Narrative-heavy",
    description: "Story and risk blocks lead. Good for exec readouts.",
  },
];

export function getViewModeLabel(mode: ViewMode): string {
  return VIEW_MODE_OPTIONS.find((o) => o.value === mode)?.label ?? "KPI-first";
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | grep "view-mode"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/features/reports/view-mode.ts
git commit -m "feat: add ViewMode type and options"
```

---

## Task 3: Section defaults in config

**Files:**
- Modify: `src/config/sections.ts`

- [ ] **Step 1: Update `sections.ts` to include defaults**

Replace the entire file with:

```typescript
// src/config/sections.ts
import type { ViewMode } from "@/features/reports/view-mode";
import type { WidgetKind } from "@/features/widgets/types";

export type SectionDefault = {
  defaultViewMode: ViewMode;
  defaultWidgets: Partial<Record<string, WidgetKind[]>>; // zoneKey → kinds
};

export const REPORTING_SECTIONS = [
  { value: "academy", label: "Academy" },
  { value: "blog", label: "Blog" },
  { value: "defensive-communications", label: "Defensive Communications" },
  { value: "geo", label: "GEO" },
  { value: "brand-os", label: "Brand OS" },
] as const;

export const SECTION_OPTIONS = REPORTING_SECTIONS.map((section) => ({
  label: section.label,
  value: section.value,
}));

export const CADENCE_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
] as const;

export function getSectionLabel(sectionValue: string) {
  return (
    REPORTING_SECTIONS.find((section) => section.value === sectionValue)?.label ?? "Unknown Section"
  );
}

/**
 * Default widget arrangements per section.
 * Applied when a new ReportDraft is created.
 * Update this config to change defaults without code changes elsewhere.
 */
export const SECTION_DEFAULTS: Record<string, SectionDefault> = {
  academy: {
    defaultViewMode: "kpi_first",
    defaultWidgets: {
      "header-summary": ["kpi_stat", "kpi_stat", "kpi_stat"],
      "what-we-learned": ["ranked_bar"],
      "where-were-going-next": ["text_insight"],
    },
  },
  blog: {
    defaultViewMode: "chart_first",
    defaultWidgets: {
      "header-summary": ["time_series"],
      "what-we-learned": ["kpi_stat", "kpi_stat", "table"],
      "where-were-going-next": ["text_insight"],
    },
  },
  "defensive-communications": {
    defaultViewMode: "narrative_heavy",
    defaultWidgets: {
      "header-summary": ["callout"],
      "what-we-learned": ["callout", "text_insight"],
      "where-were-going-next": ["text_insight"],
    },
  },
  geo: {
    defaultViewMode: "narrative_heavy",
    defaultWidgets: {
      "header-summary": ["kpi_stat", "text_insight"],
      "what-we-learned": ["text_insight", "table"],
      "where-were-going-next": ["text_insight"],
    },
  },
  "brand-os": {
    defaultViewMode: "narrative_heavy",
    defaultWidgets: {
      "header-summary": ["text_insight"],
      "what-we-learned": ["text_insight", "callout"],
      "where-were-going-next": ["text_insight"],
    },
  },
};

export function getSectionDefault(sectionValue: string): SectionDefault {
  return (
    SECTION_DEFAULTS[sectionValue] ?? {
      defaultViewMode: "kpi_first",
      defaultWidgets: {},
    }
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/config/sections.ts
git commit -m "feat: add section defaults config (viewMode + defaultWidgets)"
```

---

## Task 4: Apply section defaults on ReportDraft creation

**Files:**
- Modify: `src/features/reports/actions.ts`

When a new `ReportDraft` is created, we apply the section's default `viewMode` and seed initial `WidgetInstance` rows for the default widgets.

- [ ] **Step 1: Update `createReportDraft` action in `actions.ts`**

At the top of `actions.ts`, add these imports:

```typescript
import { getSectionDefault } from "@/config/sections";
import { REPORT_ZONES } from "@/config/reporting";
import { addWidget } from "@/lib/db/reportDrafts";
```

Replace the existing `createReportDraft` export with:

```typescript
export async function createReportDraft(data: {
  section: string;
  periodId: string;
  title: string;
}): Promise<ReportDraftSummary> {
  const session = await requireWhitelisted();

  const sectionDefault = getSectionDefault(data.section);

  // Create the draft with the section's default view mode
  const draft = await dbCreateReportDraft({
    section: data.section,
    periodId: data.periodId,
    title: data.title,
    createdByUserId: session.user.id,
    viewMode: sectionDefault.defaultViewMode,
  });

  // Seed default widgets
  const widgetInserts = Object.entries(sectionDefault.defaultWidgets).flatMap(
    ([zoneKey, kinds]) =>
      kinds.map((kind, idx) => ({
        reportDraftId: draft.id,
        widgetType: kind,
        zoneKey,
        size: "medium" as const,
        configJson: "{}",
        sortOrder: idx,
        includeInRollup: false,
      }))
  );

  await Promise.all(widgetInserts.map((w) => addWidget(w)));

  return draft;
}
```

Also update the `CreateReportDraftInput` type in `src/lib/db/reportDrafts.ts` to accept `viewMode`:

```typescript
export type CreateReportDraftInput = {
  section: string;
  periodId: string;
  createdByUserId: string;
  title: string;
  summary?: string;
  viewMode?: "kpi_first" | "chart_first" | "narrative_heavy";
};
```

And update the `createReportDraft` DB function to pass it through:

```typescript
export async function createReportDraft(
  data: CreateReportDraftInput
): Promise<ReportDraftSummary> {
  return prisma.reportDraft.create({
    data: { ...data, status: "draft" },
    select: { /* existing select */ },
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Verify in browser**

1. Create a new report draft for "Academy" section
2. Check in Prisma Studio: the new draft should have `viewMode = kpi_first` and pre-seeded `WidgetInstance` rows with `widgetType` values matching the academy defaults
3. Repeat for "Blog" — should have `viewMode = chart_first`

- [ ] **Step 4: Commit**

```bash
git add src/features/reports/actions.ts src/lib/db/reportDrafts.ts
git commit -m "feat: apply section defaults (viewMode + widgets) on ReportDraft creation"
```

---

## Task 5: View mode toggle in BuilderSessionHeader

**Files:**
- Modify: `src/components/reports/builder-session-header.tsx`
- Modify: `src/components/reports/report-builder-workspace.tsx`

- [ ] **Step 1: Read the existing `builder-session-header.tsx` and add a view mode toggle**

Open `src/components/reports/builder-session-header.tsx`. Add a `viewMode` prop and a `onViewModeChange` callback, then render three toggle buttons.

Add to the props type (look for the existing `BuilderSessionHeaderProps` type):

```typescript
import { type ViewMode, VIEW_MODE_OPTIONS } from "@/features/reports/view-mode";

// Add to props:
viewMode: ViewMode;
onViewModeChange: (mode: ViewMode) => void;
```

In the JSX, add this toggle group (insert it near the existing mode/preview toggle area):

```tsx
{/* View mode toggle */}
<div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/50 p-1">
  {VIEW_MODE_OPTIONS.map((option) => (
    <button
      key={option.value}
      type="button"
      title={option.description}
      onClick={() => onViewModeChange(option.value)}
      className={`rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] transition ${
        viewMode === option.value
          ? "bg-[var(--accent)] text-white"
          : "text-white/40 hover:text-white/70"
      }`}
    >
      {option.label}
    </button>
  ))}
</div>
```

- [ ] **Step 2: Wire viewMode state in `report-builder-workspace.tsx`**

Add state:

```typescript
import type { ViewMode } from "@/features/reports/view-mode";
import { updateDraftViewMode } from "@/features/reports/actions";

// State
const [viewMode, setViewMode] = useState<ViewMode>(
  (initialDraft?.viewMode as ViewMode) ?? "kpi_first"
);

// Handler
async function handleViewModeChange(mode: ViewMode) {
  setViewMode(mode);
  if (draftId) {
    await updateDraftViewMode(draftId, mode);
  }
}
```

Pass to `BuilderSessionHeader`:

```tsx
<BuilderSessionHeader
  // ... existing props ...
  viewMode={viewMode}
  onViewModeChange={handleViewModeChange}
/>
```

- [ ] **Step 3: Add `updateDraftViewMode` server action to `actions.ts`**

```typescript
export async function updateDraftViewMode(
  draftId: string,
  viewMode: "kpi_first" | "chart_first" | "narrative_heavy"
): Promise<ReportDraftSummary> {
  await requireWhitelisted();
  return updateReportDraft(draftId, { viewMode: viewMode as ViewMode });
}
```

Also update `UpdateReportDraftInput` in `src/lib/db/reportDrafts.ts`:

```typescript
export type UpdateReportDraftInput = {
  title?: string;
  summary?: string;
  viewMode?: "kpi_first" | "chart_first" | "narrative_heavy";
};
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 5: Verify in browser**

1. Open a report draft
2. The session header should show three view mode buttons: "Compact / KPI-first", "Chart-first", "Narrative-heavy"
3. Clicking a button updates the active state immediately
4. Refresh the page — selected mode should persist

- [ ] **Step 6: Commit**

```bash
git add src/components/reports/builder-session-header.tsx src/components/reports/report-builder-workspace.tsx src/features/reports/actions.ts src/lib/db/reportDrafts.ts
git commit -m "feat: add view mode toggle to builder session header"
```

---

## Task 6: ReportTemplate DB layer + server actions

**Files:**
- Create: `src/lib/db/reportTemplates.ts`
- Create: `src/features/reports/template-actions.ts`

- [ ] **Step 1: Create `src/lib/db/reportTemplates.ts`**

```typescript
// src/lib/db/reportTemplates.ts
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type ReportTemplateRow =
  Prisma.ReportTemplateGetPayload<Record<string, never>>;

export async function listReportTemplates(
  section?: string
): Promise<ReportTemplateRow[]> {
  return prisma.reportTemplate.findMany({
    where: section
      ? { OR: [{ section }, { section: null }] }
      : {},
    orderBy: [{ isBuiltIn: "desc" }, { createdAt: "desc" }],
  });
}

export type CreateReportTemplateInput = {
  label: string;
  description?: string;
  section?: string;
  blockPlanJson: string;
  isBuiltIn?: boolean;
  createdByUserId?: string;
};

export async function createReportTemplate(
  data: CreateReportTemplateInput
): Promise<ReportTemplateRow> {
  return prisma.reportTemplate.create({ data });
}

export async function deleteReportTemplate(id: string): Promise<void> {
  await prisma.reportTemplate.delete({ where: { id } });
}
```

- [ ] **Step 2: Create `src/features/reports/template-actions.ts`**

```typescript
// src/features/reports/template-actions.ts
"use server";

import {
  listReportTemplates,
  createReportTemplate,
  type ReportTemplateRow,
} from "@/lib/db/reportTemplates";
import { requireWhitelisted } from "@/features/auth/session";
import type { WidgetKind } from "@/features/widgets/types";
import { REPORT_ZONES } from "@/config/reporting";

export type TemplateSummary = {
  id: string;
  label: string;
  description: string | null;
  section: string | null;
  blockPlan: Partial<Record<string, WidgetKind[]>>;
  isBuiltIn: boolean;
};

function parseTemplate(row: ReportTemplateRow): TemplateSummary {
  let blockPlan: Partial<Record<string, WidgetKind[]>> = {};
  try {
    blockPlan = JSON.parse(row.blockPlanJson);
  } catch {
    blockPlan = {};
  }
  return {
    id: row.id,
    label: row.label,
    description: row.description,
    section: row.section,
    blockPlan,
    isBuiltIn: row.isBuiltIn,
  };
}

export async function getTemplatesForSection(
  section: string
): Promise<TemplateSummary[]> {
  await requireWhitelisted();
  const rows = await listReportTemplates(section);
  return rows.map(parseTemplate);
}

export async function saveCurrentReportAsTemplate(
  label: string,
  description: string,
  section: string,
  blockPlan: Partial<Record<string, WidgetKind[]>>
): Promise<TemplateSummary> {
  const session = await requireWhitelisted();
  const row = await createReportTemplate({
    label,
    description,
    section,
    blockPlanJson: JSON.stringify(blockPlan),
    isBuiltIn: false,
    createdByUserId: session.user.id,
  });
  return parseTemplate(row);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/reportTemplates.ts src/features/reports/template-actions.ts
git commit -m "feat: add ReportTemplate DB layer and server actions"
```

---

## Task 7: Save-as-template UI + update TemplatesTab to load from DB

**Files:**
- Modify: `src/components/reports/flywheel-tray/templates-tab.tsx`
- Modify: `src/components/reports/report-builder-workspace.tsx`
- Modify: `src/components/reports/builder-session-header.tsx`

- [ ] **Step 1: Update `TemplatesTab` to accept DB templates alongside built-in presets**

Replace `src/components/reports/flywheel-tray/templates-tab.tsx`:

```typescript
// src/components/reports/flywheel-tray/templates-tab.tsx
"use client";

import { reportCreationPresets } from "@/features/reports/report-presets";
import type { TemplateSummary } from "@/features/reports/template-actions";

type TemplatesTabProps = {
  dbTemplates: TemplateSummary[];
  onApplyPreset: (presetId: string) => void;
  onApplyDbTemplate: (template: TemplateSummary) => void;
};

export function TemplatesTab({ dbTemplates, onApplyPreset, onApplyDbTemplate }: TemplatesTabProps) {
  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      {/* Built-in presets */}
      {reportCreationPresets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onApplyPreset(preset.id)}
          className="rounded-[0.85rem] border border-white/10 bg-slate-950/60 px-3 py-2.5 text-left transition hover:border-[var(--accent)]/30"
        >
          <p className="text-[0.6rem] uppercase tracking-[0.12em] text-white/30">Built-in</p>
          <p className="mt-0.5 text-sm font-medium text-white">{preset.label}</p>
          <p className="mt-0.5 text-xs text-white/45">{preset.description}</p>
        </button>
      ))}

      {/* User-saved DB templates */}
      {dbTemplates.map((template) => (
        <button
          key={template.id}
          type="button"
          onClick={() => onApplyDbTemplate(template)}
          className="rounded-[0.85rem] border border-white/10 bg-slate-950/60 px-3 py-2.5 text-left transition hover:border-[var(--accent)]/30"
        >
          <p className="text-[0.6rem] uppercase tracking-[0.12em] text-white/30">Saved</p>
          <p className="mt-0.5 text-sm font-medium text-white">{template.label}</p>
          {template.description && (
            <p className="mt-0.5 text-xs text-white/45">{template.description}</p>
          )}
        </button>
      ))}

      {dbTemplates.length === 0 && reportCreationPresets.length === 0 && (
        <p className="px-1 py-4 text-center text-xs text-white/30">No templates yet</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add save-as-template button to `BuilderSessionHeader`**

Add a "Save as template" button to the session header. When clicked, it prompts for a label and calls `onSaveAsTemplate`:

```typescript
// Add to props:
onSaveAsTemplate: () => void;
```

```tsx
{/* In the header JSX */}
<button
  type="button"
  onClick={onSaveAsTemplate}
  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:border-white/25 hover:text-white/80"
>
  Save as template
</button>
```

- [ ] **Step 3: Wire save-as-template in `report-builder-workspace.tsx`**

Add state and handler:

```typescript
import { getTemplatesForSection, saveCurrentReportAsTemplate, type TemplateSummary } from "@/features/reports/template-actions";

// State
const [dbTemplates, setDbTemplates] = useState<TemplateSummary[]>([]);
const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
const [saveTemplateLabel, setSaveTemplateLabel] = useState("");

// Load DB templates on mount
useEffect(() => {
  if (!draftSection) return;
  getTemplatesForSection(draftSection).then(setDbTemplates).catch(() => {});
}, [draftSection]);

// Save current report as template
async function handleSaveAsTemplate() {
  if (!saveTemplateLabel.trim() || !draftSection) return;
  // Build blockPlan from current zones
  const blockPlan = Object.fromEntries(
    zones.map((z) => [z.key, z.cards.map((c) => c.widgetType)])
  );
  const saved = await saveCurrentReportAsTemplate(
    saveTemplateLabel.trim(),
    `Saved from ${draftTitle}`,
    draftSection,
    blockPlan
  );
  setDbTemplates((prev) => [...prev, saved]);
  setSaveTemplateOpen(false);
  setSaveTemplateLabel("");
}
```

Wire up `FlywheelTray` to pass `dbTemplates`:

```tsx
<FlywheelTray
  // ... existing props ...
  dbTemplates={dbTemplates}
  onApplyDbTemplate={(template) => {
    // Apply template.blockPlan to current draft zones
    // Same logic as onApplyPreset but using template.blockPlan directly
  }}
/>
```

Update `FlywheelTray` props to accept `dbTemplates` and `onApplyDbTemplate` and pass them to `TemplatesTab`.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 5: Verify in browser**

1. Open a report draft with some widgets
2. Click "Save as template" in the session header
3. Enter a label, save
4. Open the flywheel tray → Templates tab → the saved template appears under "Saved"
5. Click the saved template on a new/empty draft → widgets populate matching the saved layout

- [ ] **Step 6: Commit**

```bash
git add src/components/reports/flywheel-tray/templates-tab.tsx src/components/reports/builder-session-header.tsx src/components/reports/report-builder-workspace.tsx
git commit -m "feat: save-as-template UI and DB template loading in TemplatesTab"
```

---

## Phase 2 Done ✓

At this point:
- New report drafts are pre-seeded with section-appropriate widgets and view mode
- View mode toggle persists per draft
- Save-as-template captures current layout to DB
- Templates tab shows both built-in presets and user-saved templates

Mark this doc status as `Completed` and move to `implementation_phase3.md`.
