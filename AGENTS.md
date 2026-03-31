# Ledger Reporting Repo Guide

## Mission
Build and evolve an internal reporting builder plus executive readout system. This repo exists to turn CSV-first reporting inputs into structured section reports, immutable approved outputs, and executive roll-ups with low cognitive load.

## Source Of Truth
- Product and architecture decisions start in `/docs`.
- If implementation conflicts with `/docs/reporting-app/*`, update implementation unless a newer decision is recorded in `DECISIONS.md`.
- `docs/reporting-app/reference/template.html` is a visual reference only. Do not treat it as the architecture source of truth.

## Delivery Priorities
1. Keep the repo runnable.
2. Preserve the reporting story frame:
   - Where we started
   - What we learned
   - Where we're going next
3. Keep approvals/versioning safe and auditable.
4. Optimize for maintainability over feature breadth.

## Architecture Boundaries
- Keep raw ingestion, mapping, report composition, approval/versioning, and readout rendering as separate layers.
- Page files orchestrate data and feature modules. They should not own business rules.
- Business rules belong in `src/features/*` and `src/lib/*`.
- Shared UI primitives belong in `src/components/*`.
- Typed app configuration belongs in `src/config/*`.

## File And Module Rules
- Prefer files under 350 lines.
- If a file grows past roughly 250 lines, consider extracting before adding more.
- Keep route files thin and focused on layout/composition.
- Favor explicit typed objects and small modules over clever abstractions.

## Product Rules To Preserve
- Treat CSV columns as candidate fields, not automatic KPIs.
- Approved outputs are immutable snapshots.
- Editing after approval creates a new version instead of mutating the old one.
- Superseded outputs remain readable and should link to the newer version.
- Roll-up logic must be able to infer candidates while supporting editor override.
- New fields should generally require registry/config work, not page rewrites.

## Auth And Access
- Production auth is Google OAuth via Auth.js with a whitelist-driven access model.
- Development may expose a local password bypass only when explicitly gated by env config.
- Roles: `viewer`, `editor`, `approver`, `admin`.

## Working Style
- Make narrow, auditable changes.
- Do not widen scope mid-task without recording the follow-up in `ROADMAP.md`.
- Validate with deterministic checks whenever possible: lint, typecheck, build, targeted tests, schema generation.
- Record durable architecture or workflow decisions in `DECISIONS.md`.

## First-Pass Scaffold Rule
For the first implementation pass, prefer a clean runnable scaffold over half-finished workflow depth. It is acceptable to scaffold advanced flows when the code structure clearly supports later implementation.
