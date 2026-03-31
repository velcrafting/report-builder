# Reporting App Codex Bundle

This bundle is the starting spec for a flexible internal reporting app.

Included files:

- `00_CODEX_BOOTSTRAP_PROMPT.md` — master handoff prompt for Codex
- `01_PRODUCT_SPEC.md` — product goals, UX shape, workflow, permissions
- `02_ARCHITECTURE_AND_FILE_RULES.md` — stack, folder structure, engineering rules
- `03_DATA_MODEL_AND_IMPORTS.md` — entities, import flow, field registry, approvals
- `04_PAGE_MAP_AND_ACCEPTANCE.md` — pages, states, admin board, acceptance criteria
- `06_WIDGET_SYSTEM_SPEC.md` — widget taxonomy, contracts, required states, and V1/V2 build order

Recommended use:

1. Put these files in your repo under `/docs/reporting-app/`
2. Give Codex `00_CODEX_BOOTSTRAP_PROMPT.md`
3. Keep the other files in context for follow-on implementation passes
4. Force Codex to work in small commits and keep files under the size rules

This spec assumes an MVP with:

- Next.js + TypeScript + Tailwind
- Auth.js Google OAuth with whitelist config for production
- local password-only bypass for development only
- SQLite + Prisma for MVP data storage
- CSV-first import flow with mapping and widget composition
