# Ledger Reporting

Ledger Reporting is an internal reporting builder and executive readout system for communications and brand teams. It is designed to ingest CSV-based reporting, preserve flexible field mapping, compose section reports around a fixed narrative frame, and publish immutable approved outputs for executive consumption.

## Current state
- Source-of-truth product docs live in [`docs/reporting-app`](docs/reporting-app).
- The first implementation pass focuses on a clean runnable scaffold with typed foundations, route structure, visual product shell, and MVP persistence setup.
- Advanced workflow depth such as full mapping automation, approval actions, and roll-up inference is intentionally deferred after the scaffold milestone.

## Product principles
- This is not a generic dashboard.
- Every report preserves the three-part frame:
  - Where we started
  - What we learned
  - Where we're going next
- CSV columns are candidate fields, not automatic KPIs.
- Approved outputs are immutable snapshots.
- Roll-ups are built from approved outputs and should support editorial override.

## Planned stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- Auth.js for Google OAuth

## Local development
1. Install dependencies with `npm install` if needed.
2. Copy `.env.example` to `.env.local` and fill in any auth values you need.
3. Run `npm run prisma:generate` and `npm run db:init` if the local SQLite file has not already been created.
4. Run `npm run dev`.

## Core routes
- `/login`
- `/admin`
- `/admin/imports`
- `/admin/reports`
- `/admin/outputs`
- `/reports/[section]/[periodId]`
- `/rollup/[periodId]`
- `/share/output/[shareToken]`

## Documentation
- Bootstrap prompt: [`docs/00_CODEX_BOOTSTRAP_PROMPT.md`](docs/00_CODEX_BOOTSTRAP_PROMPT.md)
- Product bundle overview: [`docs/reporting-app/README.md`](docs/reporting-app/README.md)
- Visual reference: [`docs/reporting-app/reference/template.html`](docs/reporting-app/reference/template.html)
