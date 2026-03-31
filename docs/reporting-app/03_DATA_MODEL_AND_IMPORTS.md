# Data Model and Import Rules

## 1. Core domain entities

### User
Represents an authenticated app user.

Fields:

- id
- email
- name
- role (`viewer`, `editor`, `approver`, `admin`)
- isWhitelisted
- createdAt
- updatedAt

### Period
Represents a reporting window.

Fields:

- id
- cadence (`weekly`, `monthly`, `quarterly`, `custom`)
- startDate
- endDate
- label
- comparisonPeriodId (optional)
- createdAt

### ImportBatch
Represents a file upload and its metadata.

Fields:

- id
- section
- periodId
- kind (`primary`, `supplemental`)
- filename
- uploadedByUserId
- status
- uploadedAt
- notes (optional)

### RawImportRow
Stores the raw uploaded row payload.

Fields:

- id
- importBatchId
- rowIndex
- rawJson
- createdAt

### FieldRegistryEntry
Stores the mapping between source columns and internal field roles.

Fields:

- id
- section
- sourceColumnName
- internalKey
- displayLabel
- fieldType (`number`, `percent`, `currency`, `text`, `date`, `status`, `tag`, `link`, `boolean`)
- fieldRole (`kpi`, `evidence`, `takeaway`, `highlightFlag`, `classification`, `dimension`, `metric`, `note`, `ignored`)
- widgetEligible
- editableInApp
- active
- createdAt
- updatedAt

### NormalizedRecord
Optional normalized record layer created from mapping.

Fields:

- id
- section
- periodId
- importBatchId
- sourceRowId
- normalizedJson
- createdAt
- updatedAt

### ReportDraft
Represents the working report configuration for a section and period.

Fields:

- id
- section
- periodId
- createdByUserId
- status (`draft`, `in_review`)
- title
- summary
- createdAt
- updatedAt

### WidgetInstance
Represents a widget placed into a report.

Fields:

- id
- reportDraftId
- widgetType
- zoneKey
- size (`small`, `medium`, `large`)
- configJson
- sortOrder
- includeInRollup
- createdAt
- updatedAt

### InsightAnnotation
Represents manual notes and classifications.

Fields:

- id
- section
- periodId
- relatedRecordId (optional)
- relatedWidgetId (optional)
- title
- body
- classification (`highlight`, `risk`, `blocker`, `action`, `none`)
- priority (`low`, `medium`, `high`)
- promotedToRollup
- createdByUserId
- createdAt
- updatedAt

### OutputVersion
Represents a frozen or working report artifact.

Fields:

- id
- section
- periodId
- versionNumber
- state (`draft`, `in_review`, `approved`, `superseded`)
- basedOnReportDraftId
- snapshotJson
- approvedByUserId (optional)
- approvedAt (optional)
- supersededByOutputId (optional)
- createdAt
- updatedAt

### ShareLink
Represents a read-only link.

Fields:

- id
- outputVersionId
- token
- createdByUserId
- active
- createdAt
- expiresAt (optional)

### RollupVersion
Represents a roll-up built from approved outputs.

Fields:

- id
- periodId
- title
- sourceOutputIdsJson
- snapshotJson
- state (`draft`, `approved`, `superseded`)
- createdByUserId
- approvedByUserId (optional)
- createdAt
- updatedAt

## 2. Import rules

### Import metadata capture
Every upload must capture:

- section
- period/cadence
- date range
- upload kind
- uploader

### Column handling
Rules:

- all detected columns must be preserved
- new columns must appear as candidate fields
- unmapped columns must not block import success

### Mapping behavior
Mappings should be section-aware and reusable.

If the same section reuses the same source columns next period, the app should suggest or auto-apply prior mappings where safe.

## 3. Field flexibility rule

New data fields should usually require:

- a new registry entry
- optional widget configuration

New data fields should not require page rewrites unless a genuinely new widget behavior is needed.

## 4. Roll-up inference model

The app should infer likely roll-up items based on:

- explicit includeInRollup widget flag
- annotation classification
- highlight flags
- priority
- output state

Editors must be able to override.

Overrides must be stored.

## 5. Approval and versioning rules

### Approval
Only users with approver/admin capability may approve.

### Frozen approvals
Once approved:

- snapshot is immutable
- later edits create a new version
- old version remains readable
- old version surfaces a link/banner to the newer version

### Supersession
When a newer approved version replaces an older one, the older one becomes `superseded`.

## 6. Share link rules

- share links resolve only to approved or explicitly allowed outputs
- token must be non-guessable
- expired or inactive links should fail cleanly

## 7. Suggested Prisma-first priority

Codex should model these first:

- User
- Period
- ImportBatch
- RawImportRow
- FieldRegistryEntry
- ReportDraft
- WidgetInstance
- OutputVersion
- ShareLink
