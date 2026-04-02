# Ledger Reporting — Builder & Ingest Roadmap
**Date:** 2026-04-02
**Status:** Approved for implementation planning

---

## Overview

A five-phase roadmap that evolves the reporting platform from a manual CSV-upload builder into a dynamic, connector-powered reporting engine. Each phase is independently shippable and builds toward the **Expedited Pipeline** — the north-star outcome where a single template auto-populates a fully drafted report from live data sources.

### Phase order and rationale

| Phase | Feature | Rationale |
|-------|---------|-----------|
| 1 | Canva-style builder | North-star UX; establishes the template system |
| 2 | Form layout presets | Lower lift; layered on top of Phase 1 |
| 3 | Google Drive integration | Highest QOL for data ingest; unblocks live sources |
| 4 | API ingestion (Cloud Console + Profound) | Highest scaling lift; follows Drive connector pattern |
| 5 | Expedited Pipeline | Ties all phases together; template-bound orchestration |

---

## Phase 1 — Canva-Style Builder

### Goal
Evolve the existing `ReportBuilderWorkspace` into a drag-and-drop canvas experience without rebuilding the underlying data model.

### Approach
Incremental evolution. Story blocks, zone keys, sort order, widget instances, approval/versioning, and snapshot model are **unchanged**. Drag-and-drop is a UI layer on top of existing `saveWidgetInstance` / `deleteWidgetInstance` actions.

### The + Flywheel Tray

The existing `+` / `QuickAddPopover` button is replaced by a richer tabbed tray that slides up above the button on click. Three tabs:

**Data Fields tab**
- Lists all mapped fields from the active import batch for the current section/period
- Each field shows: `fieldRole`, `fieldType`, and a system-suggested widget type (derived from existing `fieldRole` + `fieldType` in the `FieldRegistryEntry`)
- Fields marked `ignored` are shown greyed out and are not draggable
- A source indicator shows which import batch the fields come from; user can switch if multiple batches exist for the period
- Drag a field onto the canvas → widget lands pre-configured with field data and suggested widget type

**Widgets tab**
- Blank widget types — identical to the current quick-add palette
- Drag onto canvas → widget lands empty, user configures manually

**Templates tab**
- Pre-built layout starters (see Phase 2)
- Click a template → populates the current draft with its widget arrangement

### Canvas drag-and-drop

Free drag anywhere on the canvas. Three interaction surfaces:

1. **Within a block** — drag to reorder widgets inside a story block. Updates `sortOrder` on drop.
2. **Between blocks** — drag a widget from one block to another. Updates `zoneKey` on the `WidgetInstance`.
3. **Between-block drop zone** — a visible drop target between blocks. Dropping here creates a new story block and places the widget as its first child.

On drag-over, blocks and slots highlight to indicate valid targets. Drop confirmation calls the existing server actions.

### Widget suggestion logic

Driven entirely by existing `fieldRole` and `fieldType` values in `FieldRegistryEntry`. No new inference engine needed.

| fieldRole | fieldType | Suggested widget |
|-----------|-----------|-----------------|
| `kpi` | `number`, `currency`, `percent` | KPI Card |
| `metric` + `dimension` | any | Chart (bar default) |
| `metric` | `number` over time | Line Chart |
| `takeaway` | `text` | Narrative Block |
| `classification` / `highlightFlag` | any | Risk / Blocker |
| `evidence` | any | Evidence Widget |
| `note` | `text` | Note Widget |

---

## Phase 2 — Form Layout Presets

### Goal
Give editors a three-layer preset system: view modes, section defaults, and template starters with save-as-template.

### Layer 1 — View Modes

Three display modes for any report. Toggled from the builder session header. Persisted per `OutputVersion`.

| Mode | Emphasis | Best for |
|------|----------|----------|
| Compact / KPI-first | Numbers lead, charts secondary | Dense executive scans |
| Chart-first | Large charts above KPIs | Trend-heavy data |
| Narrative-heavy | Story and risk blocks lead | Qualitative sections, exec readouts |

View mode does not change the widget instances — it changes their rendering order and sizing within the readout.

### Layer 2 — Section Defaults

Each department section has a recommended default widget arrangement applied automatically when a new `ReportDraft` is created for that section.

| Section | Default mode | Default widgets |
|---------|-------------|-----------------|
| Academy | KPI-first | KPI ×3, Bar Chart, Narrative |
| Blog | Chart-first | Line Chart, KPI ×2, Table |
| GEO / Brand OS | Narrative-heavy | Narrative ×2, Evidence, KPI ×1 |
| Defensive Comms | Risk-led | Risk/Blocker ×2, Action, Narrative |

Section defaults are stored in a code-level config file (extending `src/config/sections.ts`) so they can be updated without page rewrites.

### Layer 3 — Template Starters + Save-as-Template

Generic building block starters available in the **Templates tab** of the flywheel tray.

Built-in starters (minimum set):
- **Quarterly Pulse** — KPIs + trend chart + narrative + actions (5 widgets)
- **Weekly Snapshot** — 3 KPIs + 1 risk flag + 1 note (5 widgets)
- **Executive Readout** — narrative-heavy, 2 narrative blocks + evidence + KPIs

Any draft or approved report can be saved as a reusable template from the builder session header. Saved templates appear in the Templates tab for the same section or globally if marked as generic.

---

## Phase 3 — Google Drive Integration

### Part A — Import from Drive

Google Drive is added as an alternative source option on Step 1 of the import workspace. The user picks between local CSV upload or Google Drive file picker.

On Drive selection:
1. OAuth flow (if not already authenticated)
2. Drive file picker UI — shows recent Sheets and Docs
3. Selected file is fetched server-side and parsed into rows/columns
4. Hands off to the existing Step 2 (period assignment) → Step 3 (column review) → Step 4 (field mapping) flow unchanged

The `ImportBatch` gains a `sourceKind` field (`csv` | `drive` | `api`) and a nullable `driveFileId` to track the source.

### Part B — Live Sync

Import batches sourced from Drive retain the `driveFileId`. On any **draft** batch (never on approved outputs — those are frozen), an editor can trigger a re-sync:

- Re-fetches the Drive file
- Replaces `RawImportRow` records for the batch
- Re-runs column detection
- Preserves existing `FieldRegistryEntry` mappings where column names match
- New columns appear as unmapped candidates

Re-sync is only available on draft import batches. Approved outputs are immutable by existing versioning rules.

### Part C — PDF Export

Available on the shareable readout page (`/share/[token]`) for any approved output. Two export destinations:

- **Download PDF** — generates PDF server-side, downloads to local machine
- **Save to Google Drive** — generates PDF, uploads to a user-selected Drive folder via `drive.file` scope. Requires active Drive auth session (same OAuth token as import if already connected).

### Auth model

- Import / sync: `drive.readonly` scope
- Export to Drive: `drive.file` scope
- Token stored per user session — no org-wide service account required in Phase 3

---

## Phase 4 — API Ingestion

### Goal
Introduce a **connector abstraction** that normalises external API data into `ImportBatch` rows, feeding the existing import pipeline without changes downstream.

### Connector interface

Each connector implements:
- `connect(credentials)` — validates auth
- `fetchRows(params)` — returns `{ headers: string[], rows: Record<string, string>[] }`
- `getMetadata()` — returns connector name, logo, available fields

The connector output is treated identically to a parsed CSV. `ImportBatch.sourceKind` = `api`.

### Phase 4a — Google Cloud Console connector

- Auth: OAuth 2.0 (per user, same Google session as Drive if connected)
- Data: user selects metrics + dimensions + date range via a lightweight query builder in the import UI
- Covers: Google Analytics, Search Console, or custom project metrics depending on configuration
- Fetch: manual pull trigger only (no scheduled pulls in Phase 4)

### Phase 4b — Profound connector

- Auth: API key, stored per user in settings (encrypted at rest)
- Data: Profound's available metrics for GEO visibility, brand mention tracking, etc.
- Handles: pagination, rate limits, field normalisation to row format
- Fetch: manual pull trigger only

### What Phase 4 does not include

- Scheduled / automatic pulls
- Webhook-based push ingestion
- Third-party connector marketplace
- Real-time streaming

These are natural Phase 5+ additions once the connector abstraction is proven with two live sources.

---

## Phase 5 — Expedited Pipeline (North Star)

### Vision

A template carries not just widget layout but **connector configuration + field mappings**. When a new report is created from that template:

1. Configured connectors are auto-triggered (Drive sync, Cloud Console fetch, Profound fetch)
2. Data is pulled fresh for the selected period
3. Pre-saved field mappings are applied automatically
4. The editor lands in a pre-populated draft, ready for review and annotation

A weekly report that previously required manual upload → period assignment → column review → field mapping → widget placement is reduced to: **select template → select period → review draft**.

### What enables this

| Phase | Contribution |
|-------|-------------|
| 1 | Template save/load in the builder |
| 2 | Template system with stored widget layouts |
| 3 | Drive file reference stored on `ImportBatch`; re-sync mechanism |
| 4 | Connector abstraction with credential storage |
| 5 | Template schema extended with connector config; orchestration layer that fires connectors on report creation |

### Phase 5 scope (future spec)

- Template schema: add `connectorConfigs[]` — array of `{ connectorId, credentials, queryParams }`
- Report creation flow: when template has connector configs, offer "auto-populate" option
- Orchestration: server-side job that fires each connector, waits for rows, applies mappings, creates draft
- Failure handling: partial failures surface as unmapped candidate fields, not hard errors

---

## Key constraints (all phases)

- Approved outputs remain immutable — no phase changes this
- All new data sources feed the existing `ImportBatch` → `RawImportRow` → `FieldRegistryEntry` model
- Field mappings are always section-aware and reusable across periods
- No new permission model — existing `editor` / `approver` / `admin` roles apply throughout
