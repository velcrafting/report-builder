# Decisions

## 2026-03-30

### Environment capability check
- Result: shell access is available.
- Result: package-manager access is available.
- Evidence: `node -v` returned `v22.22.0`; `npm -v` returned `10.9.4`.
- Decision: proceed with real app scaffolding, dependency installation, and local validation in this environment.

### App framework
- Use Next.js with the App Router.
- Reason: aligns with the repo spec, keeps route structure clear, and supports server-first flows for auth, data loading, and future mutations.

### Language
- Use TypeScript.
- Reason: typed configs, Prisma models, and widget/report contracts are central to maintainability.

### Styling system
- Use Tailwind CSS as the primary styling layer.
- Reason: fast scaffold path, consistent internal-tool styling, and easy component composition.

### Persistence
- Use Prisma with SQLite for the MVP.
- Reason: matches the docs, keeps initial persistence lightweight, and supports future migration without overbuilding the first pass.

### Prisma compatibility
- Pin Prisma and `@prisma/client` to the v6 line for this scaffold.
- Reason: the latest Prisma v7 release changes datasource/bootstrap behavior in ways that add unnecessary setup complexity for a SQLite MVP scaffold.

### SQLite bootstrap path
- Generate the Prisma client from `prisma/schema.prisma`, and bootstrap the local SQLite file from `prisma/bootstrap.sql` via `npm run db:init`.
- Reason: Prisma client generation works cleanly, while `prisma db push` is not reliable in this environment due a schema-engine failure. The SQL bootstrap keeps the repo runnable and the database model explicit.

### Authentication
- Use Auth.js with Google OAuth and a whitelist model for production.
- Reason: explicit control over internal access while keeping the auth model simple.

### Development access
- Allow a local password bypass for development only.
- Reason: enables local workflow before Google OAuth is fully configured, but must remain env-gated and non-production.

### Field model
- Treat CSV columns as candidate fields, not automatic KPIs.
- Reason: sections have different schemas, and changing source files must not force UI rewrites.

### Output immutability
- Approved outputs are immutable snapshots.
- Reason: executive readouts require auditability and stable shared artifacts.

### Reports vs outputs
- Treat `reports` as the editable composition surface and `outputs` as the immutable published/versioned artifact surface.
- Reason: editors need a working area where structure, widgets, and narrative can evolve, while executives and share consumers need stable snapshots with clear version history.

### Roll-up strategy
- Roll-up selection is inferred from approved outputs and annotations, with editor override.
- Reason: keeps workflow efficient while preserving editorial control.

### Template model
- Each department should be able to build and evolve its own report template within shared system guardrails.
- Reason: the sections share a reporting frame, but they do not share identical KPIs, evidence types, or storytelling needs.

### Widget extensibility
- Prefer a broad, extensible widget system over a narrow fixed widget set.
- Reason: the product is meant to support visually rich and evolving reporting surfaces, so new widget types should be additive rather than requiring page rewrites.

### Data source strategy
- Support both uploaded data feeds and future integrated API feeds as inputs into the same field-mapping and report-building pipeline.
- Reason: CSV upload solves the MVP, but the long-term system should be able to suggest, pipeline, and bind multiple data sources into department-specific templates.

### First-pass scope
- Prioritize a runnable scaffold over fully complete workflow implementation.
- Reason: the first milestone is a clean product shell with typed foundations, not a sprawling half-built system.
