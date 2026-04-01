# Roadmap

## Guiding note
Phase one ends with a clean runnable scaffold, not a sprawling half-built system. Advanced workflows may be scaffolded, but they should not compromise bootability or readability.

## Phase 0: Repo formalization and operating files
- ✅ Create root operating files and environment documentation.
- ✅ Record core architectural decisions already established by the docs.
- ✅ Preserve `/docs` as the source-of-truth bundle for follow-on implementation.

## Phase 1: Scaffold and local runnable shell
- ✅ Scaffold the Next.js product at repo root around the existing docs folder.
- ✅ Install only MVP-supporting dependencies.
- ✅ Establish the route map, app layout, design system primitives, and typed mock foundations.
- ✅ Leave the repo ready for `npm run dev` and `npm run build`.

## Phase 2: Auth and permissions
- Add Auth.js with Google OAuth.
- Introduce whitelist-driven role resolution.
- Gate admin/editor/approval routes and add the development-only local bypass flow.

## Phase 3: Data model and persistence
- Expand the Prisma schema and migrations.
- Add seed data, repository helpers, and typed loaders for periods, outputs, and report drafts.
- Introduce durable status/version lifecycle helpers.
- Add first-class support for report templates, template-to-section relationships, and future data-source bindings.

## Phase 4: Imports and candidate field mapping
- Implement CSV upload persistence and raw row storage.
- Add column detection, reusable mapping suggestions, and field registry management.
- Preserve unmapped columns without breaking imports.
- Prepare the mapping layer so uploaded CSV feeds and future API feeds can enter the same candidate-field pipeline.

## Phase 5: Report builder and widget zones
- ✅ Redesign the report readout and builder so they communicate the final editorial artifact, not just admin scaffolding.
- ✅ Add editable widget composition across fixed report zones.
- ✅ Support widget sizing, narrative blocks, and evidence surfaces in the builder/readout shell.
- ✅ Add manual widget-data entry (JSON-backed) so charts/tables/timelines can render real per-widget values before CSV wiring.
- Next: add annotation capture and persist builder interactions beyond local state.
- Next: keep report assembly logic outside React views.
- Next: distinguish clearly between the editable `reports` surface and the immutable `outputs` publication surface.
- Next: support department-specific templates built from a shared but extensible widget library.
- Next: expand widget coverage so visually rich reporting is additive, not constrained by a tiny initial widget set.
- Next: map CSV upload schemas into `widgetData` contracts (`values`, `rows`, `events`, labels) through explicit field-binding UI and saved template bindings.

## Phase 6: Outputs, approvals, versions, share links
- Freeze approved outputs as immutable snapshots.
- Add supersession banners/history, approval actions, and share-token generation.
- Ensure read-only routes never expose editing controls.
- Ensure outputs render the same finalized report artifact that was composed in reports, but without edit affordances.

## Phase 7: Roll-up logic and refinement
- Build roll-up inference from approved section outputs.
- Persist editor overrides and promotion choices.
- Improve cross-section executive readability and navigation.
- Add suggestion logic that can recommend widgets, fields, or report blocks from uploaded/imported data and later integrated APIs.

## Phase 8: Polish, testing, and production hardening
- Add focused tests around imports, approvals, permissions, and share-link behavior.
- Tighten accessibility, empty/error states, and operational logging.
- Prepare production deployment, env validation, and documentation updates.

## Phase 9: CSV-to-widget field binding UI
- Add explicit binding UI so registry fields from uploaded CSVs can be wired to widget data contracts.
- Let editors select "use field X as chart metric" or "use field Y as table rows" per widget instance.
- Save bindings into WidgetInstance configJson so chart/table/KPI widgets can render from live import data.
- Add saved template bindings per section so future imports automatically suggest the same bindings.
- This is the bridge between Phase 4 (field registry) and Phase 5 (report builder) that makes CSV data flow into rendered widgets without manual JSON entry.

## Phase 10: Admin operational tooling
- Build out `admin/settings` with Period management, User management, and whitelist management.
- Period manager: create, edit, and close reporting periods; set cadence, date range, and comparison period.
- User manager: view all authenticated users, assign roles, toggle whitelist access.
- Ensure the admin birds-eye board (`/admin`) is driven by real DB data, not mocks.

## Phase 11: Audit trail and activity log
- Add an ActivityLog model to track all significant write actions (imports, approvals, promotions, share link creation, role changes).
- Expose the audit log in the admin settings view (recent 50 events, filterable by type).
- Instrument all server actions with logActivity calls.
- This is required for operational accountability before production hardening is complete.

## Phase 12: Export enhancements
- Add PDF/print rendering of approved outputs for offline distribution.
- Consider a clean print stylesheet or a server-side PDF generation step (e.g. Puppeteer or a print-optimized route).
- Share links continue to provide browser access; exports provide formal record-keeping artifacts.
