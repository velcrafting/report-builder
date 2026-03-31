# Architecture and File Rules

## 1. Recommended stack

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite for MVP
- Auth.js for Google OAuth

Reasoning:

- fast MVP path
- easy route-based app structure
- good support for auth and server actions
- small, understandable persistence layer

## 2. Architectural rule

Separate:

- raw data ingestion
- field mapping / normalization
- report composition
- output approval/versioning
- readout rendering

Do not blend those layers together.

## 3. Suggested repo structure

```txt
app/
  (auth)/
    login/
  admin/
    page.tsx
    imports/
    reports/
    outputs/
    settings/
  reports/
    [section]/
      [periodId]/
  rollup/
    [periodId]/
  share/
    output/
      [shareToken]/

components/
  primitives/
  layout/
  widgets/
  admin/
  reports/

features/
  auth/
  imports/
  mapping/
  widgets/
  reports/
  outputs/
  rollups/
  approvals/
  share-links/

lib/
  db/
  csv/
  periods/
  validation/
  permissions/
  registry/
  formatting/

config/
  sections.ts
  roles.ts
  widget-types.ts
  whitelist.ts

prisma/
  schema.prisma
```

## 4. File size rules

- hard preference: keep files under 350 lines
- split before files become bloated
- a long file must be justified by cohesion, not convenience

## 5. Component rules

- page files should compose feature modules
- no heavy business logic inside JSX
- widgets should have a thin view layer and typed config
- shared primitives must remain generic and reusable

## 6. Logic placement rules

### Put in feature/lib layers

- CSV parsing
- field type detection
- mapping logic
- roll-up inference
- approval lifecycle logic
- versioning behavior
- share token creation

### Do not put in components

- data normalization
- status derivation
- approval branching
- report assembly rules

## 7. State management

Start simple.

- server actions or route handlers for mutations
- local component state for short-lived UI interactions
- avoid introducing a heavy client-side state library unless clearly needed

## 8. Styling rules

- prioritize hierarchy and readability
- avoid decorative noise unless it communicates state
- use strong spacing and clear sectioning
- widgets should feel consistent across sections

## 9. Accessibility and clarity

- strong contrast
- obvious status labels
- readable tables
- no tiny critical text
- approval/version banners must be visually clear

## 10. Guardrails for Codex

Codex must:

- avoid clever abstractions too early
- prefer explicit typed objects
- use small focused modules
- leave comments where business rules are subtle
- avoid over-normalizing the UI before data/model layers are stable
