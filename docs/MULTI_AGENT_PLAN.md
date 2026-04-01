# Multi-Agent Implementation Plan

## Current State Summary

**Completed:** Phase 0 (repo), Phase 1 (scaffold + routes), Phase 5 partial (report builder UI + manual widget data entry).

**In place but not yet wired:**
- Prisma schema — fully defined, schema.prisma exists, dev.db exists, migrations not run
- next-auth, papaparse, react-hook-form, zod — all installed, none wired
- All route pages scaffolded with mocks, no DB or auth connections

**Priority order:** ingest → persistence → auth (noting that persistence is a prerequisite for ingest and auth, so execution order is persistence → auth → ingest, but all three must land before builder persistence or outputs can proceed).

---

## Execution Waves

Agents within a wave can run in parallel. Each wave depends on the previous wave completing.

---

## Wave 1 — Foundation (parallel)

### Agent 1A — Persistence layer (Phase 3)

**Goal:** Make the DB ready for all subsequent agents.

**Tasks:**
1. Run `prisma migrate dev --name init` — generate and apply the initial migration from the existing schema
2. Write `prisma/seed.mjs` with realistic test data:
   - 2–3 Users (one admin, one editor, one viewer)
   - 3 Periods (one weekly, one monthly, one quarterly)
   - 1 ImportBatch per period per section (Academy, Blog) with 3–5 RawImportRows
   - FieldRegistryEntries for Academy and Blog sections
   - 1 ReportDraft per period/section with 2–3 WidgetInstances
   - 1 OutputVersion (approved state) for demo purposes
   - 1 ShareLink for the approved output
3. Create `src/lib/db/prisma.ts` — singleton Prisma client (already scaffolded, confirm it's correct)
4. Create focused repository modules (one file per entity group, each under 150 lines):
   - `src/lib/db/periods.ts` — `getPeriods()`, `getPeriodById()`, `createPeriod()`
   - `src/lib/db/imports.ts` — `getImportBatchesByPeriod()`, `createImportBatch()`, `updateImportStatus()`
   - `src/lib/db/registry.ts` — `getRegistryEntries()`, `upsertRegistryEntry()`, `getRegistrySuggestions()`
   - `src/lib/db/reports.ts` — `getReportDraft()`, `createReportDraft()`, `updateReportDraft()`
   - `src/lib/db/widgets.ts` — `getWidgetsForDraft()`, `upsertWidgetInstance()`, `deleteWidgetInstance()`
   - `src/lib/db/outputs.ts` — `getOutputVersions()`, `createOutputVersion()`, `approveOutput()`, `supersede()`
   - `src/lib/db/sharelinks.ts` — `createShareLink()`, `resolveShareToken()`, `deactivateShareLink()`
   - `src/lib/db/rollups.ts` — `getRollupByPeriod()`, `createRollupDraft()`, `approveRollup()`
5. Create `src/lib/db/dashboard.ts` — `getDashboardSummary()` that returns cadence-grouped report state counts for the admin birds-eye board
6. Run `npx tsc --noEmit` and confirm no type errors

**Deliverables:** Running migrations, seeded DB, typed repository functions, clean typecheck.

---

### Agent 1B — Auth configuration (Phase 2, part 1)

**Goal:** Configure Auth.js so session and role resolution are ready before routes are gated.

**Note:** This agent can work in parallel with 1A since it's primarily config and type setup, but will need the DB for actual session lookup. Wire to DB at the end or leave a TODO shim.

**Tasks:**
1. Create `src/features/auth/config.ts`:
   - Auth.js config with GoogleProvider
   - `callbacks.signIn` — check whitelist by email, reject if not whitelisted
   - `callbacks.session` — attach `role` and `isWhitelisted` to the session user from the DB User record
   - `callbacks.jwt` — persist role in token
2. Create `src/app/api/auth/[...nextauth]/route.ts` — wire the Auth.js handler
3. Create `src/lib/permissions/index.ts`:
   - `canEdit(role)`, `canApprove(role)`, `canAdmin(role)`, `canView(role)`
   - `resolveRoleFromEmail(email, whitelist)` helper
4. Create `src/config/whitelist.ts` — typed whitelist config (load from env var `AUTH_WHITELIST` as comma-separated emails, fallback to hardcoded dev list)
5. Create `src/features/auth/session.ts`:
   - `getServerSession()` wrapper that returns typed session or null
   - `requireSession()` — throws redirect to `/login` if unauthenticated
   - `requireRole(minRole)` — throws redirect or 403 if insufficient role
6. Update `src/app/auth/login/page.tsx` and `src/app/login/page.tsx` to show real sign-in button using `signIn("google")`
7. Add dev bypass: if `NEXT_PUBLIC_DEV_AUTH_BYPASS=true`, show a local-only login form that sets a mock session (never enabled in production)
8. Run `npx tsc --noEmit`

**Deliverables:** Auth.js fully configured, typed permission helpers, session utilities, login page wired.

---

## Wave 2 — Core systems (parallel, after Wave 1)

### Agent 2A — Route protection and admin board (Phase 2, part 2)

**Depends on:** 1A and 1B complete.

**Tasks:**
1. Create `src/proxy.ts` (Next.js 16 proxy file at repo root level alongside `src/app`):
   - Protect `/admin/*` routes — require authenticated session with `isWhitelisted`
   - Protect `/reports/*` and `/rollup/*` — require authenticated session
   - Allow `/share/output/*` — public (token-gated at page level, not proxy level)
   - Allow `/login` and `/api/auth/*` — public
2. Update `src/app/admin/page.tsx` — replace mock data with `getDashboardSummary()` from `lib/db/dashboard.ts`; show real cadence-grouped status counts
3. Update `src/components/dashboard/cadence-board.tsx` — accept real data shape from DB loader
4. Confirm the admin page compiles and server-renders correctly

**Deliverables:** All admin/reports/rollup routes gated behind auth; admin board wired to real DB.

---

### Agent 2B — CSV ingest pipeline (Phase 4, part 1)

**Depends on:** 1A complete (needs ImportBatch and RawImportRow tables).

**Tasks:**
1. Create `src/lib/csv/parser.ts`:
   - `parseCSV(file: File): Promise<{ headers: string[], rows: Record<string, string>[] }>` using papaparse
   - `detectColumnTypes(headers, rows): ColumnTypeSuggestion[]` — infer FieldType per column from sampled values
2. Create `src/features/imports/actions.ts` (server actions):
   - `uploadCSV(formData)` — parse file, create ImportBatch, store RawImportRows, return batchId
   - `updateImportPeriod(batchId, periodData)` — create or link Period, update ImportBatch
   - `finalizeImportMapping(batchId, mappings)` — write FieldRegistryEntries, set status to `mapped`
3. Update `src/app/admin/imports/page.tsx`:
   - Replace import workspace mock with a real multi-step flow:
     - Step 1: Upload CSV (file input → server action)
     - Step 2: Assign section and period metadata
     - Step 3: Review detected columns with type hints
     - Step 4: Map fields (assign FieldRole to each column, skip/ignore option)
   - Show previous import batches for the selected section
4. Update `src/components/imports/import-workspace.tsx` to accept real data and call server actions
5. Create `src/components/imports/column-mapper.tsx`:
   - Table of detected columns with type badges
   - Dropdown per row: assign FieldRole (or ignore)
   - Pre-populate from existing FieldRegistryEntries for the section (mapping suggestions)
6. Run `npx tsc --noEmit`

**Deliverables:** End-to-end CSV upload flow: file → parsed → stored as raw rows → field registry populated.

---

### Agent 2C — Field registry management UI (Phase 4, part 2)

**Depends on:** 1A complete, can run in parallel with 2B.

**Tasks:**
1. Create `src/app/admin/settings/page.tsx` (currently scaffolded but empty):
   - Tabs: Field Registry | Periods | Users
2. Create `src/features/imports/registry-actions.ts` (server actions):
   - `getRegistryBySection(section)` — return all entries
   - `updateRegistryEntry(id, patch)` — update label, role, type, widgetEligible, active
   - `deactivateRegistryEntry(id)`
3. Create `src/components/admin/field-registry-table.tsx`:
   - Table: sourceColumnName, displayLabel, fieldType, fieldRole, widgetEligible, active, actions
   - Inline edit for displayLabel and fieldRole
   - Toggle active/inactive
4. Create `src/components/admin/period-manager.tsx`:
   - List existing periods (cadence, label, date range)
   - Form to create a new period
   - Server action: `createPeriod(data)` from `lib/db/periods.ts`
5. Create `src/features/auth/user-management.ts` (server actions):
   - `listUsers()`, `updateUserRole(userId, role)`, `setWhitelisted(userId, bool)`
6. Create `src/components/admin/user-table.tsx`:
   - Table: email, name, role, isWhitelisted, actions (change role, toggle whitelist)

**Deliverables:** Admin settings page with field registry browser, period manager, and user management table.

---

## Wave 3 — Builder persistence (after Wave 2)

### Agent 3A — Builder connected to DB (Phase 5 remaining, part 1)

**Depends on:** Wave 1 complete, Wave 2A complete for auth.

**Tasks:**
1. Create `src/features/reports/actions.ts` (server actions):
   - `createReportDraft(section, periodId, title)` → returns draftId
   - `getReportDraftWithWidgets(draftId)` → returns full draft + widget instances
   - `saveWidgetInstance(draftId, widget)` → upsert (by id or new)
   - `deleteWidgetInstance(widgetId)`
   - `updateDraftStatus(draftId, status)` → draft → in_review
   - `updateDraftSummary(draftId, summary)`
2. Update `src/app/admin/reports/page.tsx`:
   - List existing ReportDrafts by section + period
   - "New Report" button → calls `createReportDraft` server action
   - Click row → navigate to `/admin/reports/[draftId]`
3. Create `src/app/admin/reports/[draftId]/page.tsx`:
   - Load draft and widgets from DB via `getReportDraftWithWidgets`
   - Render `ReportBuilderWorkspace` with real persisted data
4. Update `src/components/reports/report-builder-workspace.tsx`:
   - Replace local state as source of truth with server-fetched initial state
   - Call `saveWidgetInstance` server action on widget add/edit
   - Call `deleteWidgetInstance` on widget remove
   - Call `updateDraftSummary` on summary edit
5. Wire "Submit for Review" button to `updateDraftStatus(draftId, 'in_review')`

**Deliverables:** Builder reads from and writes to DB; widget changes persist across refreshes.

---

### Agent 3B — Annotation system (Phase 5 remaining, part 2)

**Depends on:** Wave 1 complete.

**Tasks:**
1. Create `src/features/reports/annotation-actions.ts` (server actions):
   - `createAnnotation(data)`, `updateAnnotation(id, patch)`, `deleteAnnotation(id)`
   - `getAnnotationsByDraft(section, periodId)` — returns all for a section/period
   - `toggleRollupPromotion(annotationId, promote)` — set promotedToRollup
2. Create `src/components/reports/annotation-panel.tsx`:
   - List of InsightAnnotations for the current draft
   - "Add annotation" form: title, body, classification (highlight/risk/blocker/action), priority
   - Toggle "Include in roll-up"
   - Edit and delete actions
3. Integrate annotation panel into the builder workspace (side panel or below builder canvas)
4. Wire annotation counts into the builder session header (e.g. "3 annotations, 1 flagged for rollup")

**Deliverables:** Annotations can be created, edited, deleted, and flagged for roll-up, all persisted to DB.

---

## Wave 4 — Outputs, approvals, share links (after Wave 3)

### Agent 4A — Output approval workflow (Phase 6)

**Depends on:** Wave 3 complete.

**Tasks:**
1. Create `src/features/outputs/actions.ts` (server actions):
   - `promoteToOutput(draftId)` — create OutputVersion from ReportDraft, status=`draft`, snapshot current widget state into `snapshotJson`
   - `approveOutput(outputId, userId)` — set state=`approved`, freeze snapshot, set approvedAt
   - `supersede(outputId, newOutputId)` — set old state=`superseded`, set supersededByOutputId
2. Update `src/app/admin/outputs/page.tsx`:
   - List OutputVersions grouped by section, with version number and state
   - "Approve" action (only shown to `approver`/`admin` roles)
   - Supersession banner: if a newer version exists, show link to it
   - "Promote to output" action from the reports list (or available from the builder)
3. Create `src/components/reports/output-version-banner.tsx`:
   - Shows on approved/superseded outputs: version number, approval date, link to newer version if superseded
4. Update `src/app/reports/[section]/[periodId]/page.tsx`:
   - Load the most recent approved OutputVersion for section/period
   - Render the frozen `snapshotJson` through `ExecutiveReadout` (not the live draft)
   - If no approved output, show a "draft preview" banner to editors

**Deliverables:** Outputs can be promoted, approved (frozen), and superseded. Section report routes show approved snapshots.

---

### Agent 4B — Share links (Phase 6)

**Depends on:** 4A complete.

**Tasks:**
1. Create `src/features/share-links/actions.ts` (server actions):
   - `generateShareLink(outputVersionId, userId, expiresAt?)` — creates ShareLink with `crypto.randomUUID()` token
   - `deactivateShareLink(linkId)`
   - `listShareLinks(outputVersionId)` — returns all links for an output
2. Update `src/app/admin/outputs/page.tsx`:
   - "Generate Share Link" button next to approved outputs
   - List active links with copy-to-clipboard and deactivate option
3. Update `src/app/share/output/[shareToken]/page.tsx`:
   - Resolve token via `resolveShareToken(token)` — return 404 if not found, expired, or inactive
   - Render the frozen output snapshot without any editing controls
   - No session required (public route)
4. Add token expiry check: if `expiresAt < now()`, return a "link expired" page (not a generic 404)

**Deliverables:** Share links generate, work publicly, and can be deactivated. Expired links display a clear message.

---

## Wave 5 — Roll-up logic (after Wave 4)

### Agent 5A — Roll-up composition (Phase 7)

**Depends on:** Wave 4 complete.

**Tasks:**
1. Create `src/lib/rollups/infer.ts`:
   - `inferRollupCandidates(sectionOutputs)` — extract widgets and annotations with `includeInRollup=true` or `promotedToRollup=true` or classification in (`highlight`, `action`)
   - `buildRollupSnapshot(periodId, sectionOutputs, overrides)` — compose cross-section roll-up snapshot
2. Create `src/features/rollups/actions.ts` (server actions):
   - `createRollupDraft(periodId, userId)` — gather all approved OutputVersions for period, run infer, create RollupVersion
   - `updateRollupOverride(rollupId, sectionKey, widgetOverrides)` — persist editor override choices
   - `approveRollup(rollupId, userId)` — freeze roll-up snapshot
3. Update `src/app/rollup/[periodId]/page.tsx`:
   - Load or create RollupVersion for the period
   - Render inferred highlights per section
   - Show editor controls for approved-only users (override promotion choices)
   - "Approve Roll-up" action

**Deliverables:** Roll-up page shows inferred cross-section highlights from approved outputs; editors can override and approve.

---

## Wave 6 — Polish and hardening (Phase 8, new Phase 10 + 11)

### Agent 6A — Audit trail and operational logging

**Depends on:** Waves 1–5 complete (or can start alongside Wave 5).

**Tasks:**
1. Add `ActivityLog` Prisma model (new migration):
   - `id`, `userId`, `action` (enum), `entityType`, `entityId`, `details (json)`, `createdAt`
   - Actions: `IMPORT_UPLOADED`, `MAPPING_SAVED`, `DRAFT_CREATED`, `OUTPUT_PROMOTED`, `OUTPUT_APPROVED`, `OUTPUT_SUPERSEDED`, `SHARE_LINK_CREATED`, `ROLLUP_APPROVED`
2. Write `src/lib/db/activity.ts` — `logActivity(action, entityType, entityId, userId, details?)` helper
3. Instrument the key server actions from Waves 2–5 with `logActivity` calls
4. Add audit log view to `src/app/admin/settings/page.tsx` (new "Activity" tab) — recent 50 events, filterable by action type

**Deliverables:** All significant actions logged; admin can view recent activity.

---

### Agent 6B — Tests and hardening

**Depends on:** Wave 5 complete.

**Tasks:**
1. Add `@testing-library/react`, `vitest`, and `@vitejs/plugin-react` (or jest + ts-jest) as devDependencies
2. Write focused unit tests:
   - `src/lib/csv/parser.test.ts` — column type detection with sample rows
   - `src/lib/rollups/infer.test.ts` — candidate inference logic
   - `src/lib/permissions/index.test.ts` — role checks
3. Write integration tests (using Prisma test client with a separate test DB):
   - Import batch creation and raw row storage
   - Output promotion and snapshot freeze
   - Share token resolution (active, expired, inactive)
4. Add `NODE_ENV` guard to dev auth bypass — throw at startup if bypass env is set in production
5. Tighten empty/error states: all list pages should have an explicit empty state, all server actions should return typed error responses

**Deliverables:** Critical paths have test coverage; dev bypass is production-safe; empty states handled.

---

## Additional phases added to ROADMAP

These were missing from the original roadmap and surface real implementation gaps:

**Phase 9 — CSV-to-widget field binding UI**
The field registry captures column→role mappings. This phase makes those bindings usable in the builder: a section editor can select "use data from registry field X as the chart metric for this widget" and the binding is saved with the WidgetInstance configJson. Required before CSV data can flow into chart/table widgets.

**Phase 10 — Admin operational tooling**
Period management, user/whitelist management, and the admin settings page (addressed partially in Wave 2C above but deserves its own phase for completeness and expansion).

**Phase 11 — Audit trail and activity log**
All write actions (uploads, approvals, share link creation, role changes) should be logged. Addressed in Wave 6A.

**Phase 12 — Export enhancements**
Read-only share links provide access; a future phase adds PDF/print rendering of approved outputs for offline distribution and formal records.

---

## Dependency graph

```
Wave 1A (persistence) ──────────────────────────────────────┐
Wave 1B (auth config) ──────────────────────────────────────┤
                                                             ↓
Wave 2A (route gating + admin board) ──────────────────────┐ │
Wave 2B (CSV ingest pipeline) ─────────────────────────────┤ │
Wave 2C (field registry + settings UI) ────────────────────┘ │
                                                             ↓
Wave 3A (builder persistence) ─────────────────────────────┐
Wave 3B (annotation system) ───────────────────────────────┘
                                                             ↓
Wave 4A (output approval) ─────────────────────────────────┐
Wave 4B (share links) ─────────────────────────────────────┘
                                                             ↓
Wave 5A (roll-up logic) ───────────────────────────────────┐
                                                             ↓
Wave 6A (audit trail) ─────────────────────────────────────┐
Wave 6B (tests + hardening) ───────────────────────────────┘
```

---

## Notes for agent coordination

- Each agent should run `npx tsc --noEmit` before declaring done
- Each agent should not widen scope: if a follow-up need is discovered, add a note to ROADMAP.md instead of absorbing it
- Agents 2B and 2C share the imports feature directory — coordinate on action file naming to avoid conflicts if running in parallel
- Agents 3A and 3B both touch `report-builder-workspace.tsx` — 3A should complete first or they should agree on props interface before diverging
- Wave 2A depends on both Wave 1A (for `getDashboardSummary`) and Wave 1B (for `requireSession`) — confirm both are complete before starting
