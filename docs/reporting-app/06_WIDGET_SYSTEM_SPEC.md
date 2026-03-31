# Widget System Spec

## Goals
- Make the executive preview the primary report-building surface.
- Keep editing low-cognitive-load with inline controls plus modal depth when needed.
- Support durable extensibility: new widget types should be added without page rewrites.
- Treat reporting as three layers, not chart-only UI:
  - Metric primitives
  - Narrative/content primitives
  - Structural/report primitives

## Non-Goals (V1)
- Full BI-platform parity.
- Arbitrary nested layout builders.
- Infinite custom theming/token authoring UI.

## Core Principles
- Preview-first: users edit in the same visual surface executives consume.
- Separation of concerns: widget content vs container/chrome/layout.
- Explicit states: loading/empty/error/stale are first-class.
- Accessibility and export are baseline, not add-ons.
- Prefer evidence + narrative pairing over decorative charts.

## Widget Taxonomy

### Metric primitives
- KPI stat card
- Sparkline card
- Time series chart
- Ranked/grouped/stacked bar
- Composition (donut, constrained use)
- Bullet chart
- Heatmap
- Map (only when geography is meaningful)
- Table/grid

### Narrative/content primitives
- Text insight block
- Callout/alert block
- Quote block
- Before/after comparison block
- Recommendation block

### Structural/report primitives
- Section header/divider
- Timeline/event rail
- Progress/stepper
- Entity/profile block
- Attachment/media block

## Universal Widget Contract
Every widget instance must conform to:

```ts
type WidgetInstance = {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  description?: string;
  data: unknown;
  config: Record<string, unknown>;
  layout: {
    size: "full" | "half" | "third" | "sidebar";
    minHeight?: number;
  };
  theme: {
    density?: "compact" | "standard" | "expanded";
    tone?: "default" | "teal" | "amber" | "rose" | "sky";
  };
  states: {
    loading?: boolean;
    empty?: boolean;
    partial?: boolean;
    error?: boolean;
    stale?: boolean;
    filtered?: boolean;
    expanded?: boolean;
  };
  bindings?: {
    dateRange?: string;
    filters?: string;
    sourceFields?: string[];
  };
  interactions?: {
    expandable?: boolean;
    downloadable?: boolean;
    crossFilter?: boolean;
  };
  visibilityRules?: Array<Record<string, unknown>>;
  exportOptions?: {
    pdfSafe?: boolean;
    csvExport?: boolean;
  };
};
```

## Required Widget Behaviors
- Must render in compact/standard/expanded density.
- Must support inline title/body editing where applicable.
- Must support drag/move between sections.
- Must support duplicate/remove/restore.
- Must support size change (`small/medium/large`) mapped to layout slots.
- Must expose a “controls” modal for advanced options.
- Must degrade gracefully in print/PDF mode.

## Required Report Behaviors
- Inline editing in executive preview.
- Command palette for frequent actions.
- Undo/redo for preview-state mutations.
- Section-level theme controls.
- Dotted add-slot placeholder when space allows.
- Auto stretch when section row has a single visible block.

## Data vs Narrative Pairing Rule
- Metric widgets should not ship alone in section bodies.
- Each metric-heavy section should include at least one narrative primitive:
  - Text insight, callout, or recommendation.

## Charting Rules
- Default chart: time series line/area.
- Ranked bars are preferred over pie/donut for long labels and comparisons.
- Gauges are limited use; require bounded domain + threshold semantics.
- Bullet chart is preferred for target-vs-actual compact reporting.
- Dual-axis usage requires explicit justification.

## Annotation and Evidence Requirements
- Widgets can carry:
  - event markers
  - analyst notes
  - evidence/source links
  - confidence score (for narrative widgets)
- Timeline and chart widgets should support annotation overlays.

## Accessibility + Export Requirements
- Keyboard-accessible interactions for all actionable controls.
- Non-color encodings for status/severity.
- Text alternatives or summary for chart widgets.
- PDF-safe labels (no hover-only critical info).

## Recommended V1 Widget Pack
1. KPI stat card
2. Sparkline card
3. Time series chart
4. Ranked bar chart
5. Table/grid
6. Text insight block
7. Callout box
8. Timeline/event rail

## Recommended V2 Widget Pack
1. Bullet chart
2. Donut/composition
3. Linear meter (gauge alternative)
4. Heatmap
5. Entity/profile card
6. Attachment/media block
7. Progress/stepper
8. Map (if geography-driven use case is validated)

## Implementation Build Order

### Phase A: Contracts and registry
- Define typed widget contracts and runtime validation.
- Introduce widget registry and renderer abstraction.
- Add storybook/test fixtures for states.

### Phase B: Preview-first operations
- Stabilize move/duplicate/resize/theme/edit interactions.
- Add multi-select + batch operations.
- Add keyboard move and reorder shortcuts.

### Phase C: Data bindings
- Bind widgets to imported data with explicit field mapping.
- Add cross-widget global bindings (date range + filters).
- Add source/evidence footers.

### Phase D: Export + governance
- Print/PDF-safe layout mode.
- Version-safe widget snapshots for approved outputs.
- Validation rules per widget type before approval.

## Suggested File Boundaries
- `src/features/widgets/types.ts` — core contracts
- `src/features/widgets/registry.ts` — widget registry entries
- `src/features/widgets/renderers/*` — per-widget renderer modules
- `src/features/widgets/config/*` — per-widget config schemas
- `src/features/widgets/presets/*` — reusable presets
- `src/features/reports/preview-state.ts` — preview state orchestration

## Acceptance Criteria
- Adding a new widget type does not require route-level changes.
- Every widget can render all required states.
- Executive preview is sufficient for most report editing tasks.
- Undo/redo and keyboard flows are functional and test-covered.
- Exported output preserves hierarchy and semantic meaning.
