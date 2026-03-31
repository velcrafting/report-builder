# Operating Files and Bootstrap Order

## Recommendation

Yes. The bootstrap prompt should explicitly tell Codex to create the operating layer first.

That means Codex should formalize the repo before it starts feature implementation.

## Why this helps

Without an operating layer, the first pass often turns into:

- drifting structure
- unclear architectural boundaries
- no durable record of decisions
- messy follow-on work for future agents

A small operating layer fixes that early.

## Files that should exist at the root early

### 1. `AGENTS.md`
Purpose:
- tells current and future coding agents how to work in this repo

Should include:
- repo mission
- architecture rules
- separation of concerns
- file size constraint
- how to add features safely
- how to handle field flexibility
- how to handle approvals/versioning
- expected coding and commit behavior

### 2. `DECISIONS.md`
Purpose:
- living architecture decision log

Use it for:
- auth approach
- data model choices
- versioning rules
- roll-up behavior
- widget strategy

### 3. `ROADMAP.md`
Purpose:
- delivery sequence and build phases

### 4. `README.md`
Purpose:
- orientation for humans

### 5. `.env.example`
Purpose:
- document required environment variables clearly

### 6. `.gitignore`
Purpose:
- standard hygiene and local file cleanup

## Optional but useful

### `CHANGELOG.md`
Useful if you expect many iterations and want visible milestone tracking.

### `TASKLIST.md`
Useful if you want a plain-English current work queue separate from the roadmap.

I would treat this as optional. `ROADMAP.md` plus issues may be enough.

## Should you initialize the repo yourself?

You do not have to, but here is the practical answer.

### Best option

Create an empty repo with:
- the docs bundle in `/docs/reporting-app/`
- maybe a minimal root `README.md`

Then let Codex scaffold the app, install dependencies, and build from there.

### Why

That gives Codex a clean starting point but still anchors it with source-of-truth docs.

### Important caveat

Codex can only do npm installs and full scaffolding if the environment it runs in has shell/package-manager access.

If it does, it should absolutely handle:
- app initialization
- npm installs
- file generation
- initial project structure

If the environment is read-only or tool-limited, it will need you to run the bootstrap commands yourself.

## Recommended instruction to add to bootstrap

Add this instruction:

```md
Before building the app, create and populate the repo operating layer: `AGENTS.md`, `DECISIONS.md`, `ROADMAP.md`, `README.md`, `.env.example`, and `.gitignore`. Treat these as first-class project artifacts, not placeholders.
```
