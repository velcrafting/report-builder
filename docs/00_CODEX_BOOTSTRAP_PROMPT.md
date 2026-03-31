# Codex Bootstrap Prompt — Flexible Internal Reporting App

You are implementing a flexible internal reporting app for a communications and brand organization.

This is not a generic analytics dashboard. It is a reporting builder plus executive readout system.

## Core context

The organization has five distinct reporting sections:

- Academy
- Blog
- Defensive Communications
- GEO
- Brand OS

Each section has different KPIs and supporting evidence, but all reporting must fit a common executive-friendly structure.

The app must serve:

- department heads
- executives
- broader internal teams in read-only mode

The output must be easy to skim, new-reader friendly, and visually strong without high cognitive load.

## Core reporting story

Every section report must follow the same three-part reporting frame:

1. Where we started
2. What we learned
3. Where we're going next

This is the universal narrative shell.

## Product shape

Build a reporting system with two major surfaces:

1. **Editor/Admin Surface**
   - upload CSVs
   - map fields
   - create and edit widgets
   - annotate records
   - mark highlights / risks / blockers / actions
   - approve outputs
   - see status across weekly / monthly / quarterly outputs

2. **Readout Surface**
   - clean per-section reports
   - clean roll-up view
   - read-only shareable links for approved outputs

## Required workflows

### Import workflow

- editors upload one primary CSV per section per period
- app may also support optional supplemental CSVs for supporting evidence
- import stores raw data exactly as uploaded
- import captures metadata at upload level:
  - section
  - cadence (`weekly`, `monthly`, `quarterly`, `custom`)
  - period start
  - period end
  - optional comparison period
- app detects columns and lets users map them to internal field roles
- unmapped columns must remain available as candidate fields
- new fields must not break the app

### Field flexibility rule

Do **not** treat every CSV column as a KPI.
Treat every column as a **candidate field**.

A mapped field may become one of the following:

- KPI
- supporting evidence field
- narrative/takeaway field
- highlight flag
- classification field (`risk`, `blocker`, `action`, `highlight`, `none`)
- chart dimension
- chart metric
- link / metadata field
- unused for this output

### Widget composition workflow

Editors must be able to assemble section reports from mapped fields using widgets.

Support widget types such as:

- KPI card
- chart widget
- table widget
- narrative highlight card
- risk/blocker/action card
- evidence list/table
- freeform note block

Widget behavior:

- widgets are placed into fixed report zones
- widgets can have size variants: `small`, `medium`, `large`
- widgets may be included or excluded from roll-up
- app may infer roll-up candidates, but editors can override

### Approval and versioning workflow

Each section output for a period must have lifecycle states:

- Draft
- In Review
- Approved for Exec Readout
- Superseded

Rules:

- approved outputs are immutable snapshots
- editing an approved output creates a new version instead of mutating the old one
- old approved output remains frozen
- old output shows a banner linking to the newer version if one exists
- roll-up views should pull from approved outputs only

## Auth and permissions

Use:

- **Google OAuth + whitelist config** for production
- **simple local password bypass for development only**

Roles:

- `viewer` — read-only reports and outputs
- `editor` — upload, map fields, annotate, build widgets
- `approver` — approve outputs for exec readout
- `admin` — manage whitelist, templates, settings

Prefer a config file or env-driven allowlist for permitted editor/approver/admin emails.

## Required admin birds-eye board

Logged-in whitelisted users must have a birds-eye admin view that shows reporting state by cadence.

Example sections in the admin board:

- Weekly
- Monthly
- Quarterly

Within each cadence row or column, show report state groupings such as:

- Draft
- In Review
- Approved
- Superseded
- Read-Only Link Generated

This board should make it very easy to see where each section currently stands for a given cadence and period.

## Roll-up logic

The roll-up should be generated from approved section outputs.

The app should:

- infer best-fit highlights / risks / next steps for roll-up
- let editors override those choices
- retain override decisions per output version

## UX rules

The app is for internal executive readability.

Rules:

- minimal cognitive lift
- strong visual hierarchy
- no noisy dashboard clutter
- no giant wall-of-metrics pages
- every page should answer “so what?”
- every section report should retain the three-part story frame

Use a structured but flexible page layout:

- summary/header zone
- where we started zone
- what we learned zone
- where we're going next zone
- supporting evidence zone

Do **not** allow totally freeform page building with no layout guardrails.

## Technical direction

Implement the MVP with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + SQLite for MVP persistence
- Auth.js for Google auth

Use a clean architecture with small files and strong separation of concerns.

## Engineering constraints

- no file should exceed 350 lines unless absolutely necessary
- page files should orchestrate, not contain business logic
- business rules must live in feature or lib layers
- parsing, mapping, scoring, and roll-up logic must not live inline in React components
- use shared primitives and typed config wherever possible
- preserve human readability over cleverness
- everything must be purpose-built and justified by value


## Phase 0 — first formalization step

Before building product code, Codex must first formalize the repository operating layer.

Create the root directory structure and the following operating files first:

- `AGENTS.md`
- `DECISIONS.md`
- `ROADMAP.md`
- `README.md`
- `.env.example`
- `.gitignore`
- `docs/reporting-app/` (copy or mirror the spec bundle into this area)

### Required operating file intent

#### `AGENTS.md`
Defines how coding agents should work in this repo.

It should include:
- repo purpose
- architecture boundaries
- file size rule (target under 350 lines)
- coding style rules
- feature ownership/layering rules
- how to add new fields safely
- how to handle approvals/versioning safely
- how to propose and log architectural changes
- expected working style: small commits, clear notes, no giant one-pass rewrites

#### `DECISIONS.md`
Acts as a running architectural decision log.

It should include:
- date
- decision title
- status
- context
- decision made
- consequences

Seed it with the initial major decisions from this spec.

#### `ROADMAP.md`
Defines implementation phases and sequencing.

It should include:
- Phase 0: repo formalization
- Phase 1: scaffolding and auth shell
- Phase 2: data model and imports
- Phase 3: mapping and registry
- Phase 4: report builder
- Phase 5: approvals, versions, share links
- Phase 6: roll-up and refinement

#### `README.md`
Must explain:
- what this app is
- how it is structured
- how to run it locally
- how permissions work
- where the spec docs live

### Required order of work

Codex should work in this order:

1. formalize repo operating files
2. scaffold app and dependencies
3. set up auth shell and env example
4. set up data model and persistence
5. build imports and mapping flow
6. build admin/report/output pages
7. build approval/version/share workflows
8. build roll-up

Do not skip the operating files.

## Deliverables for the first Codex pass

Codex should:

1. scaffold the app structure
2. set up auth shell and local dev bypass
3. implement the base data model
4. implement the import metadata flow
5. implement a first CSV upload + field mapping flow
6. implement the core page map
7. implement the admin birds-eye status board
8. implement section report builder scaffolding
9. implement immutable approved outputs and version banners
10. implement read-only output routes

## Required pages/routes

At minimum, create routes for:

- `/login`
- `/admin`
- `/admin/imports`
- `/admin/reports`
- `/admin/outputs`
- `/reports/[section]/[periodId]`
- `/rollup/[periodId]`
- `/share/output/[shareToken]`

You may adjust route names if the architecture stays clear and consistent.

## Important implementation notes

- raw imported rows must be stored separately from mapped/normalized fields
- new CSV columns must appear as candidate fields, not errors
- widgets should be config-driven where reasonable
- approved outputs must be snapshots
- share links should resolve only to approved or explicitly shared outputs
- design the data model so adding new fields later is cheap

## Working style

Implement in small, reviewable chunks.

Start with the data model and scaffolding, then auth shell, then imports, then admin board, then report builder scaffolding.

Do not try to finish every advanced feature in one pass.

Use the supporting docs in this directory as source-of-truth constraints.
