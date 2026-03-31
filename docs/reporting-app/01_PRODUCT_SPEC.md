# Product Spec — Flexible Internal Reporting App

## 1. Purpose

Build a lightweight internal reporting platform that turns CSV-based reporting into structured, interactive, executive-friendly outputs.

The product must support five sections with distinct reporting needs:

- Academy
- Blog
- Defensive Communications
- GEO
- Brand OS

The product must remain flexible as reporting targets shift over time.

## 2. Product principle

This is a **reporting builder with approval and roll-up workflows**, not a static dashboard.

The system should make it cheap to:

- ingest changing data
- map new fields
- compose section reports
- approve outputs
- generate executive roll-ups

## 3. Primary audiences

### Primary

- Department heads
- Executives

### Secondary

- Broader internal teams with read-only visibility

## 4. Reporting story frame

Every section report must preserve this structure:

1. Where we started
2. What we learned
3. Where we're going next

This should be visible in every approved output.

## 5. Key product surfaces

### A. Editor/Admin surface

For whitelisted users only.

Capabilities:

- upload imports
- assign period metadata
- map fields
- create and edit widgets
- annotate records
- classify items
- approve outputs
- review historical outputs
- monitor report state by cadence

### B. Readout surface

For viewers and share consumers.

Capabilities:

- view section readouts
- view approved roll-ups
- consume read-only share links
- navigate approved history

## 6. Required statuses

Section outputs and report artifacts must support:

- Draft
- In Review
- Approved for Exec Readout
- Superseded

## 7. Admin birds-eye board

The app must provide a birds-eye view for logged-in whitelisted users.

This should show state by cadence, for example:

- Weekly
- Monthly
- Quarterly

Each cadence grouping should expose report status coverage:

- Draft
- In Review
- Approved
- Superseded
- Read-Only Link Generated

The goal is instant operational visibility.

## 8. Input model

### Primary rule

The typical case is **one primary CSV per section per period**.

### Secondary rule

The app should allow optional supplemental CSVs per section/period for supporting evidence or extra detail.

### Period metadata

Period metadata should be assigned at upload time:

- cadence
- start date
- end date
- optional comparison period

Row-level date fields may exist, but the upload itself should still have explicit period metadata.

## 9. Field strategy

Each CSV column is a candidate field.

Fields may be mapped to roles such as:

- KPI
- supporting evidence
- narrative takeaway
- highlight flag
- classification
- link
- note
- chart dimension
- chart metric
- ignored

This keeps the system flexible without making every field a KPI.

## 10. Widget strategy

Reports should be built from widgets placed into fixed layout zones.

### Widget types

Minimum set:

- KPI card
- chart widget
- table widget
- narrative insight widget
- risk/blocker/action widget
- evidence widget
- note widget

### Widget sizing

Support:

- small
- medium
- large

### Widget roll-up behavior

Widgets or the content inside them may be eligible for roll-up.

The app should infer likely roll-up candidates but allow editor override.

## 11. Roll-up behavior

Roll-ups should:

- use approved section outputs only
- infer best-fit highlights and next steps
- allow editor override
- preserve override choices per output version

## 12. Versioning and frozen approvals

Once an output is approved:

- it is frozen
- edits create a new version
- the old approved version remains readable
- the old version shows that a newer version exists

This is non-negotiable.

## 13. Sharing

The app should support:

- internal route-based report viewing
- read-only share links for approved outputs
- share links for approved roll-ups

## 14. Non-goals for MVP

Do not overbuild into a full BI platform.

Avoid:

- unrestricted freeform layouts
- deeply nested permission systems
- overcomplicated analytics engines
- production-grade external integrations before CSV flow is stable

## 15. MVP success criteria

The MVP is successful when a whitelisted editor can:

1. upload a CSV
2. assign period metadata
3. map fields
4. build a section report using widgets
5. annotate and classify insights
6. approve the output
7. generate a read-only link
8. see it reflected in the admin status board
9. have the approved output become eligible for roll-up
