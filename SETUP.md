# Ledger Reporting — Setup Guide

> **Written after a multi-wave build session.** Everything in this guide reflects the current
> codebase state as of 2026-04-01.

---

## Quick start (5 commands)

```bash
npm install
cp .env.local.example .env.local   # then fill in values — see §Environment Variables
npx prisma migrate dev              # applies migrations to dev.db
node prisma/seed.mjs                # loads demo data (4 users, 3 periods, sample reports)
npm run dev                         # → http://localhost:3000
```

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 20 LTS |
| npm | 10+ |
| SQLite | (bundled via `better-sqlite3`) |

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."               # run: openssl rand -base64 32

# Google OAuth (production auth)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Access control (comma-separated emails)
AUTH_ADMIN_EMAILS="you@example.com"
AUTH_WHITELIST="you@example.com"

# Dev shortcut — set true to skip Google OAuth in local development
# NEXT_PUBLIC_DEV_AUTH_BYPASS=true
```

### Dev auth bypass

If you don't want to set up Google OAuth for local work, uncomment
`NEXT_PUBLIC_DEV_AUTH_BYPASS=true`. This exposes a credential login form at `/login`
with a fixed test user (`dev@example.com` / `dev`). **Never enable in production.**

---

## Database

The app uses **Prisma + SQLite** (`prisma/dev.db`). The database file is git-ignored.

```bash
# First-time setup (or after `git pull` with new migrations)
npx prisma migrate dev

# Reset + reseed from scratch
npx prisma migrate reset --force
node prisma/seed.mjs

# Push schema changes without migration history (dev-only, e.g. after adding a model)
npx prisma db push

# Inspect the DB in a browser UI
npx prisma studio
```

### Schema overview (13 models)

| Model | Purpose |
|-------|---------|
| `User` | Auth users; `role` (viewer/editor/admin), `isWhitelisted` flag |
| `Period` | Reporting periods (e.g. "Q1 2026") |
| `FieldRegistryEntry` | Named data fields per section, drives column mapping UI |
| `ImportBatch` | A single CSV upload run |
| `RawImportRow` | Raw rows from an import, JSON-encoded |
| `NormalizedRecord` | Post-mapping normalized records |
| `ReportDraft` | A section report in progress (`draft` → `in_review`) |
| `WidgetInstance` | Widgets attached to a draft |
| `InsightAnnotation` | Highlights, risks, blockers, and actions on a report |
| `OutputVersion` | Approved/versioned snapshot of a report |
| `ShareLink` | Shareable public link for an `OutputVersion` |
| `RollupVersion` | Cross-section roll-up report |
| `AuditLog` | Fire-and-forget event log for state changes |

---

## Application Routes

### Public

| Route | Description |
|-------|-------------|
| `/` | Landing / dashboard |
| `/login` | Sign in page (Google OAuth + dev bypass) |
| `/share/output/[token]` | Public share page (no auth required) |

### Authenticated (`/reports/*`, `/rollup/*`)

| Route | Description |
|-------|-------------|
| `/reports/[section]/[periodId]` | Executive readout for a section |
| `/rollup/[periodId]` | Roll-up report view |

### Admin (`/admin/*` — whitelisted users only)

| Route | Description |
|-------|-------------|
| `/admin` | Control room dashboard |
| `/admin/imports` | Upload CSV data |
| `/admin/reports` | List and create report drafts |
| `/admin/reports/[draftId]` | Report builder workspace |
| `/admin/rollup` | Roll-up composer |
| `/admin/settings?tab=registry` | Field registry editor |
| `/admin/settings?tab=periods` | Period manager |
| `/admin/settings?tab=users` | User roles and whitelist |
| `/admin/audit` | Audit event log |
| `/admin/outputs` | Output version catalog |

---

## Feature Walkthrough

### 1. Data Import

1. Go to **Admin → Imports**
2. Upload a `.csv` file
3. Select (or create) a reporting period
4. Review auto-detected column types (date, currency, percent, etc.)
5. Map CSV columns to field registry entries per section
6. Save — rows land in `RawImportRow`, mappings update `FieldRegistryEntry`

### 2. Report Drafts

1. Go to **Admin → Reports**
2. Click "Start a new draft" → choose section + period + title
3. Click the draft link → opens the **Report Builder Workspace**
4. Add/remove/reorder widget instances (persisted to DB on every change)
5. Use "Submit for Review" in the header to move status `draft → in_review`
6. The **Approval Panel** at the bottom of the page handles `in_review → approved`
   and creates an `OutputVersion` snapshot

### 3. Share Links

Once a draft has at least one `OutputVersion`, share links can be generated via the
`SharePanel` component (shown on the draft page after approval).

- Each link has a unique UUID token
- Token → `/share/output/[token]` (public, no login required)
- Revoking a link sets `active = false` (soft delete) so the URL 404s
- Share links respect the `expiresAt` field

### 4. Annotations

On any report page, the **Annotation Panel** lets editors add insights:

- **Classification**: highlight (emerald), risk (amber), blocker (red), action (blue)
- **Priority**: low / medium / high
- **Roll-up toggle**: promoted annotations flow into the cross-section roll-up

### 5. Roll-up Composition

1. Go to **Admin → Roll-up**
2. Select a period (URL param `?periodId=...`)
3. Check which approved `OutputVersion`s to include
4. Give it a title and click "Compose Roll-up"
5. The resulting `RollupVersion` is readable at `/rollup/[periodId]`

### 6. Settings

**Admin → Settings** has three tabs:

| Tab | What you can do |
|-----|----------------|
| `?tab=registry` | Edit field labels, assign section roles, toggle widget inclusion, deactivate entries |
| `?tab=periods` | Create new reporting periods |
| `?tab=users` | Change user roles (viewer/editor/admin), toggle whitelist access |

---

## Code Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # All admin pages (whitelisted)
│   ├── reports/            # Executive readout pages
│   ├── rollup/             # Roll-up view pages
│   ├── share/              # Public share pages (no auth)
│   ├── login/              # Sign-in page
│   └── api/auth/           # next-auth route handler
│
├── components/
│   ├── admin/              # Field registry, user table, period manager
│   ├── dashboard/          # Cadence board, status cards
│   ├── imports/            # 4-step CSV upload flow
│   ├── layout/             # AppShell, sidebar nav, page intro
│   ├── reports/            # Builder workspace, annotation panel, approval panel, share panel
│   ├── rollup/             # Roll-up composer
│   └── ui/                 # Shared primitives (SurfaceCard, EmptyState, etc.)
│
├── features/
│   ├── auth/               # next-auth config, session helpers, permission utils
│   ├── imports/            # CSV upload server actions, registry actions
│   ├── periods/            # Period creation actions
│   ├── reports/            # Report draft + widget actions, approval + share actions
│   ├── rollup/             # Roll-up server actions
│   └── widgets/            # Widget type registry and definitions
│
├── lib/
│   ├── csv/                # CSV parser + column type detector
│   ├── db/                 # Prisma client + typed repository modules
│   │   ├── prisma.ts       # Singleton Prisma client
│   │   ├── periods.ts      # listPeriods, getPeriod, createPeriod, updatePeriod
│   │   ├── imports.ts      # listImportBatches, createImportBatch, insertRawRows
│   │   ├── fieldRegistry.ts
│   │   ├── reportDrafts.ts # getReportDraft, setReportDraftStatus, addWidget, etc.
│   │   ├── outputs.ts      # listOutputVersions, createOutputVersion, approveOutput
│   │   ├── shareLinks.ts   # createShareLink, getShareLinkByToken (standalone)
│   │   ├── annotations.ts  # listAnnotations, createAnnotation, toggleRollupPromotion
│   │   ├── rollups.ts      # createRollupVersion, listRollupVersions, getApprovedRollup
│   │   ├── auditLog.ts     # logAuditEvent, listAuditEvents
│   │   ├── users.ts        # listUsers, setUserRole, setUserWhitelisted
│   │   └── index.ts        # Barrel re-export (except shareLinks.ts — import directly)
│   └── permissions/        # canView, canEdit, canApprove, canAdmin helpers
│
├── config/
│   ├── sections.ts         # REPORTING_SECTIONS array + getSectionLabel()
│   └── whitelist.ts        # AUTH_WHITELIST env var reader
│
└── proxy.ts                # Next.js 16 route gating (replaces middleware.ts)
```

### Key patterns

**Server actions** live in `src/features/*/` with `"use server"` at the top. They call
the DB layer in `src/lib/db/` and then re-validate or `router.refresh()` on the client.

**DB layer** is a thin typed wrapper around Prisma. Import from `@/lib/db` for most
operations. Import `shareLinks.ts` directly to avoid type conflicts with `outputs.ts`.

**Auth** uses `next-auth v4` (not v5). Session helpers are in `src/features/auth/session.ts`:
- `getAppSession()` — nullable session
- `requireSession()` — redirects to `/login` if unauthenticated
- `requireWhitelisted()` — requires `isWhitelisted: true`
- `requireRole("admin")` — requires minimum role

**Route gating** is handled by `src/proxy.ts`:
- `/admin/*` — requires whitelisted session
- `/reports/*`, `/rollup/*` — requires any session
- `/share/output/*` — public pass-through
- `/login` — public pass-through

---

## npm Scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run lint` | ESLint |
| `npm run db:seed` | Re-run the seed script |
| `npm run db:push` | Push schema to DB without migration |
| `npm run prisma:generate` | Regenerate Prisma client |

---

## Common issues

### "Database not found" on first run
Run `npx prisma migrate dev` — this creates `prisma/dev.db` and applies all migrations.

### "No periods found" after seeding
The seed script (`prisma/seed.mjs`) creates 3 periods. If the DB is empty, run:
```bash
node prisma/seed.mjs
```

### Auth redirect loop
Make sure `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set in `.env.local`.
For local dev, set `NEXT_PUBLIC_DEV_AUTH_BYPASS=true` to skip Google OAuth entirely.

### TypeScript errors after pulling
Stale build artifacts can cause phantom errors. Clear with:
```bash
rm -rf .next tsconfig.tsbuildinfo
npm run typecheck
```

### Prisma client out of sync after schema change
```bash
npx prisma generate
```

---

## Git history

The project was built in coordinated waves using parallel agents:

| Commit | Wave | What was built |
|--------|------|----------------|
| `cbf6643` | 1A | Prisma migrations, seed data, typed DB repository |
| `a19562b` | 1B | next-auth v4, session helpers, permissions, login UI |
| `476e1ce` | 2A | proxy.ts route gating, admin dashboard wired to DB |
| `b94e394` | 2B | CSV parser, 4-step import flow, column mapper, field mapping |
| `0bbd2a5` | 2C | Settings UI: field registry table, period manager, user table |
| `acf9e78` | 3B | Annotation panel: create/edit/delete insights, roll-up toggle |
| `d139576` | 3A | Report builder persistence: DB-backed drafts, widget instances |
| `1cf4b31` | 4 | Output approval workflow + share links |
| `acbd881` | 5 | Roll-up composition |
| `3e049d4` | 6 | Audit trail, nav wiring, error/empty states |
| `cdc25f1` | — | Housekeeping: gitignore, env example |
