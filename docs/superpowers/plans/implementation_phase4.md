# Phase 4 — API Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Not started — begin after Phase 3 is complete

**Goal:** Introduce a connector abstraction layer and implement two connectors — Google Cloud Console and Profound — that feed data into the existing import pipeline via `ImportBatch.sourceKind = 'api'`.

**Architecture:** A `Connector` interface normalises each external API's output into `{ headers, rows }` — the same shape the CSV parser already produces. The existing import pipeline (period → columns → mapping) is unchanged. Credentials are stored per user in a new `ConnectorCredential` model. Both connectors use a manual pull trigger in Phase 4; scheduled pulls are Phase 5+.

**Tech Stack:** Next.js 16, TypeScript, Prisma, `googleapis` (already installed from Phase 3), Profound REST API (key-authenticated).

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `prisma/schema.prisma` | Modify | Add `ConnectorCredential` model |
| `src/lib/connectors/types.ts` | Create | `Connector` interface and shared types |
| `src/lib/connectors/google-cloud-console.ts` | Create | GCC connector (Analytics/Search Console) |
| `src/lib/connectors/profound.ts` | Create | Profound connector |
| `src/lib/connectors/index.ts` | Create | Registry: map connectorId → Connector instance |
| `src/lib/db/connectorCredentials.ts` | Create | CRUD for ConnectorCredential |
| `src/features/imports/connector-actions.ts` | Create | Server actions: saveCredential, pullFromConnector |
| `src/components/imports/connector-picker.tsx` | Create | UI to pick connector, enter credentials, trigger pull |
| `src/components/imports/import-source-picker.tsx` | Modify | Add "API Connector" tab alongside CSV and Drive |

---

## Task 1: Schema — ConnectorCredential model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `ConnectorCredential` model**

```prisma
model ConnectorCredential {
  id            String   @id @default(cuid())
  userId        String
  connectorId   String   // e.g. "google-cloud-console", "profound"
  credentialJson String  // Encrypted JSON (access token or API key payload)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, connectorId])
}
```

Add reverse relation on `User`:

```prisma
model User {
  // ... existing ...
  connectorCredentials ConnectorCredential[]
}
```

- [ ] **Step 2: Run migration**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting
npx prisma migrate dev --name add_connector_credentials
npx prisma generate
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add ConnectorCredential model for API connector auth"
```

---

## Task 2: Connector interface and types

**Files:**
- Create: `src/lib/connectors/types.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/connectors/types.ts

export type ConnectorFetchParams = {
  startDate: string;  // ISO date string, e.g. "2026-01-01"
  endDate: string;
  metrics?: string[];
  dimensions?: string[];
};

export type ConnectorFetchResult = {
  headers: string[];
  rows: Record<string, string>[];
};

export type ConnectorMetadata = {
  id: string;
  label: string;
  description: string;
  authKind: "oauth" | "api_key";
  availableMetrics: string[];
  availableDimensions: string[];
};

export interface Connector {
  metadata: ConnectorMetadata;

  /**
   * Validate that the provided credential is usable.
   * Throws if invalid.
   */
  validateCredential(credential: string): Promise<void>;

  /**
   * Fetch data and return normalised rows.
   */
  fetchRows(
    credential: string,
    params: ConnectorFetchParams
  ): Promise<ConnectorFetchResult>;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | grep "connectors"
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/connectors/types.ts
git commit -m "feat: add Connector interface and shared types"
```

---

## Task 3: Google Cloud Console connector

**Files:**
- Create: `src/lib/connectors/google-cloud-console.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/connectors/google-cloud-console.ts
// Fetches Google Analytics 4 data via the Google Analytics Data API.
// Credential is a Google OAuth access token (same as Drive, from the session).

import { google } from "googleapis";
import type { Connector, ConnectorFetchParams, ConnectorFetchResult, ConnectorMetadata } from "./types";

export class GoogleCloudConsoleConnector implements Connector {
  metadata: ConnectorMetadata = {
    id: "google-cloud-console",
    label: "Google Cloud Console",
    description: "Pulls metrics from Google Analytics 4 for your connected property.",
    authKind: "oauth",
    availableMetrics: ["sessions", "activeUsers", "screenPageViews", "bounceRate", "averageSessionDuration"],
    availableDimensions: ["date", "pagePath", "deviceCategory", "country"],
  };

  async validateCredential(credential: string): Promise<void> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: credential });
    // Attempt a lightweight API call to validate the token
    const analyticsAdmin = google.analyticsadmin({ version: "v1beta", auth });
    await analyticsAdmin.properties.list({ filter: "parent:accounts/-" });
  }

  async fetchRows(
    credential: string,
    params: ConnectorFetchParams
  ): Promise<ConnectorFetchResult> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: credential });
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });

    // GA4 property ID must be configured — read from env
    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId) throw new Error("GA4_PROPERTY_ID env var is not set.");

    const metrics = (params.metrics ?? ["sessions", "activeUsers"]).map(
      (name) => ({ name })
    );
    const dimensions = (params.dimensions ?? ["date"]).map((name) => ({ name }));

    const response = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: params.startDate, endDate: params.endDate }],
        metrics,
        dimensions,
      },
    });

    const dimensionHeaders =
      response.data.dimensionHeaders?.map((h) => h.name ?? "") ?? [];
    const metricHeaders =
      response.data.metricHeaders?.map((h) => h.name ?? "") ?? [];
    const headers = [...dimensionHeaders, ...metricHeaders];

    const rows = (response.data.rows ?? []).map((row) => {
      const dimValues = row.dimensionValues?.map((v) => v.value ?? "") ?? [];
      const metValues = row.metricValues?.map((v) => v.value ?? "") ?? [];
      const values = [...dimValues, ...metValues];
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
    });

    return { headers, rows };
  }
}

export const googleCloudConsoleConnector = new GoogleCloudConsoleConnector();
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/connectors/google-cloud-console.ts
git commit -m "feat: add Google Cloud Console (GA4) connector"
```

---

## Task 4: Profound connector

**Files:**
- Create: `src/lib/connectors/profound.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/connectors/profound.ts
// Fetches GEO visibility and brand mention data from Profound's REST API.
// Credential is an API key stored as a plain string.

import type { Connector, ConnectorFetchParams, ConnectorFetchResult, ConnectorMetadata } from "./types";

const PROFOUND_BASE_URL = "https://api.profound.co/v1";

export class ProfoundConnector implements Connector {
  metadata: ConnectorMetadata = {
    id: "profound",
    label: "Profound",
    description: "Pulls GEO visibility and brand mention data from Profound.",
    authKind: "api_key",
    availableMetrics: ["visibility_score", "mention_count", "share_of_voice", "sentiment_score"],
    availableDimensions: ["date", "brand", "topic", "platform"],
  };

  async validateCredential(apiKey: string): Promise<void> {
    const response = await fetch(`${PROFOUND_BASE_URL}/account`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      throw new Error(`Profound API key invalid: ${response.status} ${response.statusText}`);
    }
  }

  async fetchRows(
    apiKey: string,
    params: ConnectorFetchParams
  ): Promise<ConnectorFetchResult> {
    const metrics = params.metrics ?? ["visibility_score", "mention_count"];
    const dimensions = params.dimensions ?? ["date", "brand"];

    const searchParams = new URLSearchParams({
      start_date: params.startDate,
      end_date: params.endDate,
      metrics: metrics.join(","),
      dimensions: dimensions.join(","),
    });

    // Paginate: fetch up to 1000 rows
    let allRows: Record<string, string>[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      searchParams.set("page", String(page));
      searchParams.set("per_page", "100");

      const response = await fetch(
        `${PROFOUND_BASE_URL}/reports/data?${searchParams.toString()}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );

      if (!response.ok) {
        throw new Error(`Profound fetch failed: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      const pageRows: Record<string, string>[] = json.data ?? [];
      allRows = [...allRows, ...pageRows];

      hasMore = pageRows.length === 100 && allRows.length < 1000;
      page++;
    }

    const headers = allRows.length > 0 ? Object.keys(allRows[0]) : [...dimensions, ...metrics];
    return { headers, rows: allRows };
  }
}

export const profoundConnector = new ProfoundConnector();
```

> **Note:** The Profound API endpoint and response shape above are illustrative. When integrating with the real Profound API, update `PROFOUND_BASE_URL`, endpoint paths, response field names, and auth header format to match their actual API documentation.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/connectors/profound.ts
git commit -m "feat: add Profound connector"
```

---

## Task 5: Connector registry + credential DB + server actions

**Files:**
- Create: `src/lib/connectors/index.ts`
- Create: `src/lib/db/connectorCredentials.ts`
- Create: `src/features/imports/connector-actions.ts`

- [ ] **Step 1: Create `src/lib/connectors/index.ts`**

```typescript
// src/lib/connectors/index.ts
import { googleCloudConsoleConnector } from "./google-cloud-console";
import { profoundConnector } from "./profound";
import type { Connector } from "./types";

const connectorRegistry = new Map<string, Connector>([
  [googleCloudConsoleConnector.metadata.id, googleCloudConsoleConnector],
  [profoundConnector.metadata.id, profoundConnector],
]);

export function getConnector(connectorId: string): Connector {
  const connector = connectorRegistry.get(connectorId);
  if (!connector) throw new Error(`Unknown connector: ${connectorId}`);
  return connector;
}

export function listConnectors(): Connector[] {
  return Array.from(connectorRegistry.values());
}

export type { Connector } from "./types";
export type { ConnectorFetchParams, ConnectorFetchResult, ConnectorMetadata } from "./types";
```

- [ ] **Step 2: Create `src/lib/db/connectorCredentials.ts`**

```typescript
// src/lib/db/connectorCredentials.ts
import { prisma } from "./prisma";

export async function getConnectorCredential(
  userId: string,
  connectorId: string
): Promise<string | null> {
  const row = await prisma.connectorCredential.findUnique({
    where: { userId_connectorId: { userId, connectorId } },
  });
  return row ? row.credentialJson : null;
}

export async function upsertConnectorCredential(
  userId: string,
  connectorId: string,
  credentialJson: string
): Promise<void> {
  await prisma.connectorCredential.upsert({
    where: { userId_connectorId: { userId, connectorId } },
    create: { userId, connectorId, credentialJson },
    update: { credentialJson },
  });
}
```

- [ ] **Step 3: Create `src/features/imports/connector-actions.ts`**

```typescript
// src/features/imports/connector-actions.ts
"use server";

import { requireWhitelisted } from "@/features/auth/session";
import { getConnector, listConnectors, type ConnectorMetadata } from "@/lib/connectors";
import { getConnectorCredential, upsertConnectorCredential } from "@/lib/db/connectorCredentials";
import { prisma } from "@/lib/db/prisma";
import type { ConnectorFetchParams } from "@/lib/connectors/types";

export type ConnectorInfo = ConnectorMetadata & { hasCredential: boolean };

export async function listAvailableConnectors(): Promise<ConnectorInfo[]> {
  const session = await requireWhitelisted();
  const connectors = listConnectors();
  return Promise.all(
    connectors.map(async (c) => {
      const cred = await getConnectorCredential(session.user.id, c.metadata.id);
      return { ...c.metadata, hasCredential: !!cred };
    })
  );
}

export async function saveConnectorCredential(
  connectorId: string,
  credential: string
): Promise<void> {
  const session = await requireWhitelisted();
  const connector = getConnector(connectorId);
  await connector.validateCredential(credential); // throws if invalid
  await upsertConnectorCredential(session.user.id, connectorId, credential);
}

export type ConnectorPullResult = {
  batchId: string;
  headers: string[];
  totalRows: number;
};

export async function pullFromConnector(params: {
  connectorId: string;
  section: string;
  periodId: string;
  kind: "primary" | "supplemental";
  fetchParams: ConnectorFetchParams;
}): Promise<ConnectorPullResult> {
  const session = await requireWhitelisted();
  const connector = getConnector(params.connectorId);

  const credential = await getConnectorCredential(session.user.id, params.connectorId);
  if (!credential) throw new Error(`No credential saved for ${params.connectorId}.`);

  const { headers, rows } = await connector.fetchRows(credential, params.fetchParams);

  const batch = await prisma.importBatch.create({
    data: {
      section: params.section,
      periodId: params.periodId,
      kind: params.kind,
      filename: `${connector.metadata.label} — ${params.fetchParams.startDate} to ${params.fetchParams.endDate}`,
      sourceKind: "api",
      uploadedByUserId: session.user.id,
      status: "uploaded",
    },
  });

  if (rows.length > 0) {
    await prisma.rawImportRow.createMany({
      data: rows.map((row, index) => ({
        importBatchId: batch.id,
        rowIndex: index,
        rawJson: JSON.stringify(row),
      })),
    });
  }

  return { batchId: batch.id, headers, totalRows: rows.length };
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/connectors/ src/lib/db/connectorCredentials.ts src/features/imports/connector-actions.ts
git commit -m "feat: connector registry, credential storage, and pull server action"
```

---

## Task 6: Connector picker UI + wire into ImportSourcePicker

**Files:**
- Create: `src/components/imports/connector-picker.tsx`
- Modify: `src/components/imports/import-source-picker.tsx`

- [ ] **Step 1: Create `src/components/imports/connector-picker.tsx`**

```typescript
// src/components/imports/connector-picker.tsx
"use client";

import { useEffect, useState } from "react";
import {
  listAvailableConnectors,
  saveConnectorCredential,
  pullFromConnector,
  type ConnectorInfo,
} from "@/features/imports/connector-actions";
import type { ConnectorFetchParams } from "@/lib/connectors/types";

type ConnectorPickerProps = {
  section: string;
  periodId: string;
  onPullComplete: (result: { batchId: string; headers: string[]; totalRows: number }) => void;
  loading: boolean;
};

export function ConnectorPicker({ section, periodId, onPullComplete, loading }: ConnectorPickerProps) {
  const [connectors, setConnectors] = useState<ConnectorInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchParams, setFetchParams] = useState<ConnectorFetchParams>({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    listAvailableConnectors().then(setConnectors).catch(console.error);
  }, []);

  const selected = connectors.find((c) => c.id === selectedId);

  async function handleSaveCredential() {
    if (!selectedId || !apiKey.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await saveConnectorCredential(selectedId, apiKey.trim());
      setConnectors((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, hasCredential: true } : c))
      );
      setApiKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save credential");
    } finally {
      setSaving(false);
    }
  }

  async function handlePull() {
    if (!selectedId || !fetchParams.startDate || !fetchParams.endDate) return;
    setPulling(true);
    setError(null);
    try {
      const result = await pullFromConnector({
        connectorId: selectedId,
        section,
        periodId,
        kind: "primary",
        fetchParams,
      });
      onPullComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pull failed");
    } finally {
      setPulling(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Connector list */}
      <div className="flex flex-col gap-2">
        {connectors.map((connector) => (
          <button
            key={connector.id}
            type="button"
            onClick={() => setSelectedId(connector.id)}
            className={`rounded-[1.1rem] border px-4 py-3 text-left transition ${
              selectedId === connector.id
                ? "border-[var(--accent)]/50 bg-[var(--accent)]/10"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{connector.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{connector.description}</p>
              </div>
              {connector.hasCredential && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-[0.65rem] text-emerald-400">
                  Connected
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Credential entry for selected connector (API key connectors only) */}
      {selected && !selected.hasCredential && selected.authKind === "api_key" && (
        <div className="space-y-2">
          <label className="block text-xs text-slate-400">API Key</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="flex-1 rounded-[0.85rem] border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
            />
            <button
              type="button"
              disabled={saving || !apiKey.trim()}
              onClick={handleSaveCredential}
              className="rounded-[0.85rem] border border-[var(--accent)]/45 bg-[var(--accent)]/15 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Date range + pull trigger */}
      {selected && selected.hasCredential && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="block text-xs text-slate-400">Start date</label>
              <input
                type="date"
                value={fetchParams.startDate}
                onChange={(e) => setFetchParams((p) => ({ ...p, startDate: e.target.value }))}
                className="w-full rounded-[0.85rem] border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="block text-xs text-slate-400">End date</label>
              <input
                type="date"
                value={fetchParams.endDate}
                onChange={(e) => setFetchParams((p) => ({ ...p, endDate: e.target.value }))}
                className="w-full rounded-[0.85rem] border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={pulling || !fetchParams.startDate || !fetchParams.endDate}
            onClick={handlePull}
            className="w-full rounded-[0.85rem] bg-[var(--accent)] py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {pulling ? "Pulling data…" : `Pull from ${selected.label}`}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-[1rem] border border-red-500/30 bg-red-950/40 px-3 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add "API Connector" tab to `ImportSourcePicker`**

In `src/components/imports/import-source-picker.tsx`, add a third source option:

```typescript
import { ConnectorPicker } from "./connector-picker";

// Add to the Source type:
type Source = "csv" | "drive" | "connector";

// Add a third button:
<button
  type="button"
  onClick={() => setSource("connector")}
  className={`rounded-full border px-4 py-1.5 text-sm transition ${
    source === "connector"
      ? "border-[var(--accent)]/50 bg-[var(--accent)]/15 text-white"
      : "border-white/10 text-slate-400 hover:text-white"
  }`}
>
  API Connector
</button>

// Add the panel:
{source === "connector" && (
  <ConnectorPicker
    section={/* pass section from parent */}
    periodId={/* pass periodId from parent */}
    onPullComplete={onConnectorPullComplete}
    loading={loading}
  />
)}
```

> **Note:** `ImportSourcePicker` currently receives `section` and `kind` implicitly through `FormData` in the CSV path. For connector pulls, these need to be passed as explicit props. Thread `section` and `periodId` down from `ImportWorkspace` into `ImportSourcePicker`, and add `onConnectorPullComplete` as a callback prop that advances the workspace to Step 3 (column review).

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 4: Verify in browser**

1. Navigate to `/admin/imports`
2. Step 1 shows three source tabs: CSV | Google Drive | API Connector
3. Select "API Connector" — connectors list shows Google Cloud Console and Profound
4. For Profound: enter API key, save, confirm "Connected" badge
5. Set a date range and click "Pull from Profound" — flow advances to column review with pulled rows
6. Complete field mapping — batch appears in admin imports list with `sourceKind = api`

- [ ] **Step 5: Commit**

```bash
git add src/components/imports/connector-picker.tsx src/components/imports/import-source-picker.tsx
git commit -m "feat: add API connector picker UI to import workflow"
```

---

## Phase 4 Done ✓

At this point:
- Connector abstraction exists with a clean interface
- Google Cloud Console (GA4) and Profound connectors are registered
- Credentials are stored securely per user
- API-sourced import batches flow through the same pipeline as CSV and Drive
- Import Step 1 offers three source tabs: CSV, Google Drive, API Connector

Mark this doc status as `Completed`. Phase 5 (Expedited Pipeline) requires its own spec — see `docs/superpowers/specs/2026-04-02-builder-ingest-roadmap-design.md` Phase 5 section for the north star description.
