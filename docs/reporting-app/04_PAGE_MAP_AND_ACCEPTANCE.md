# Page Map and Acceptance Criteria

## 1. Page map

### `/login`
Purpose:
- authenticate users via Google OAuth in production
- allow local development bypass where configured

### `/admin`
Purpose:
- birds-eye control room for reporting activity

Must show:
- Weekly group
- Monthly group
- Quarterly group
- state counts or clear grouped cards for Draft / In Review / Approved / Superseded / Read-Only Link Generated
- quick links into imports, reports, outputs

### `/admin/imports`
Purpose:
- upload CSVs
- assign section and period metadata
- review detected columns
- enter mapping flow

### `/admin/reports`
Purpose:
- edit section reports
- build widgets
- annotate items
- mark items for roll-up
- move outputs into review

### `/admin/outputs`
Purpose:
- review versions and approval state
- approve outputs
- generate share links
- view supersession banners and history

### `/reports/[section]/[periodId]`
Purpose:
- display a section report
- show the three reporting phases
- render approved or viewable draft depending on permission

### `/rollup/[periodId]`
Purpose:
- display roll-up from approved section outputs
- provide high-level executive-friendly navigation into sections

### `/share/output/[shareToken]`
Purpose:
- render a read-only approved output or allowed shared artifact

## 2. Report layout zones

Every section report should use a structured layout with these zones:

- Header summary
- Where we started
- What we learned
- Where we're going next
- Supporting evidence

The widgets within those zones may vary by section.

## 3. Admin birds-eye board acceptance

The admin control room is successful when a logged-in whitelisted user can:

- see weekly / monthly / quarterly groupings
- see which section outputs are draft / in review / approved / superseded
- see whether read-only links have been generated
- click into the appropriate management route from each item

## 4. Import flow acceptance

The import flow is successful when an editor can:

- upload a CSV
- assign section and period metadata
- see detected columns
- map fields
- preserve unmapped fields without failure

## 5. Report builder acceptance

The report builder is successful when an editor can:

- create or edit a report for a section and period
- add widgets into defined zones
- choose widget size
- attach narrative takeaways or notes
- classify annotations as highlight / risk / blocker / action
- choose or override roll-up eligibility

## 6. Approval/versioning acceptance

Approval/versioning is successful when:

- only the right roles can approve
- approval creates a frozen snapshot
- editing later produces a new version
- old approved version remains accessible
- old version clearly links to the new version

## 7. Sharing acceptance

Sharing is successful when:

- approved outputs can generate read-only links
- read-only routes do not expose editing controls
- share links are stable and obvious to use

## 8. Roll-up acceptance

Roll-up is successful when:

- roll-up pulls from approved section outputs only
- app surfaces inferred highlights and next steps
- editors can override what gets promoted
- roll-up output remains readable and low-friction

## 9. Engineering acceptance

Implementation is successful when:

- files remain small and readable
- page files are not overloaded with logic
- data mapping, inference, approvals, and versioning live outside components
- the system is easy to extend with new fields later
