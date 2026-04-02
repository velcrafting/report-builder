# Phase 3 — Google Drive Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Not started — begin after Phase 2 is complete

**Goal:** Add Google Drive as an import source (with live sync on draft batches) and PDF export (to local machine or Drive) from the approved readout page.

**Architecture:** Extend `ImportBatch` schema with `sourceKind` (csv/drive/api) and `driveFileId`. Add Google OAuth scopes (`drive.readonly` for import/sync, `drive.file` for export) to the existing NextAuth config. Add a Drive file picker to Step 1 of `ImportWorkspace`. Server actions handle Drive fetching, re-sync, and PDF generation. PDF export lives on the share readout page.

**Tech Stack:** Next.js 16, React 19, TypeScript, Prisma, NextAuth v4, Google APIs (`googleapis` npm package), Puppeteer or `@sparticuz/chromium` for PDF generation.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `prisma/schema.prisma` | Modify | Add `sourceKind` enum + `driveFileId` to `ImportBatch` |
| `prisma/migrations/...` | Create | Migration for schema changes |
| `src/features/auth/config.ts` | Modify | Add `drive.readonly` + `drive.file` Google OAuth scopes |
| `src/lib/drive/drive-client.ts` | Create | Google Drive API client (list files, fetch file as CSV rows) |
| `src/features/imports/drive-import-action.ts` | Create | Server actions: listDriveFiles, importFromDrive |
| `src/features/imports/drive-sync-action.ts` | Create | Server action: resyncDriveBatch |
| `src/components/imports/import-source-picker.tsx` | Create | Step 1 UI: CSV upload vs Drive picker |
| `src/components/imports/drive-file-picker.tsx` | Create | Drive file list + select UI |
| `src/components/imports/import-workspace.tsx` | Modify | Replace Step 1 UploadStep with ImportSourcePicker |
| `src/lib/pdf/generate-pdf.ts` | Create | PDF generation from a report URL |
| `src/features/reports/pdf-export-action.ts` | Create | Server action: exportToPdf, exportToDrive |
| `src/app/share/output/[shareToken]/page.tsx` | Modify | Add export PDF button |

---

## Task 1: Schema — add sourceKind + driveFileId to ImportBatch

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `ImportSourceKind` enum and update `ImportBatch`**

In `prisma/schema.prisma`, add after existing enums:

```prisma
enum ImportSourceKind {
  csv
  drive
  api
}
```

In the `ImportBatch` model, add two fields:

```prisma
model ImportBatch {
  // ... existing fields ...
  sourceKind       ImportSourceKind @default(csv)
  driveFileId      String?          // Google Drive file ID; null for CSV/API sources
  driveFileName    String?          // Human-readable name for display
}
```

- [ ] **Step 2: Run migration**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting
npx prisma migrate dev --name add_import_source_kind
npx prisma generate
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add sourceKind and driveFileId to ImportBatch"
```

---

## Task 2: Add Google Drive OAuth scopes to NextAuth config

**Files:**
- Modify: `src/features/auth/config.ts`

- [ ] **Step 1: Read the current auth config and add scopes**

Open `src/features/auth/config.ts`. Find the Google provider configuration. Add `drive.readonly` and `drive.file` to the authorization scope, and enable `access_type: "offline"` to get a refresh token.

The Google provider block should look like:

```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope:
        "openid email profile https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file",
      access_type: "offline",
      prompt: "consent",
    },
  },
}),
```

Also update the NextAuth callbacks to store the access token on the session so it's available server-side:

```typescript
callbacks: {
  async jwt({ token, account }) {
    if (account) {
      token.accessToken = account.access_token;
      token.refreshToken = account.refresh_token;
    }
    return token;
  },
  async session({ session, token }) {
    (session as typeof session & { accessToken?: string }).accessToken =
      token.accessToken as string | undefined;
    return session;
  },
},
```

- [ ] **Step 2: Add env vars to `.env.local`**

```bash
# Already present — confirm these exist:
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# Also add if not present:
# NEXTAUTH_SECRET=
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add src/features/auth/config.ts
git commit -m "feat: add Drive OAuth scopes to Google auth provider"
```

---

## Task 3: Google Drive API client

**Files:**
- Create: `src/lib/drive/drive-client.ts`

- [ ] **Step 1: Install googleapis**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npm install googleapis
npm install --save-dev @types/googleapis 2>/dev/null || true
```

- [ ] **Step 2: Create `src/lib/drive/drive-client.ts`**

```typescript
// src/lib/drive/drive-client.ts
import { google } from "googleapis";

export type DriveFileSummary = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
};

function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

/**
 * List the user's recent Sheets and CSV files from Google Drive.
 * Returns up to 20 files, newest first.
 */
export async function listDriveFiles(
  accessToken: string
): Promise<DriveFileSummary[]> {
  const drive = getDriveClient(accessToken);
  const response = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' or mimeType='text/csv'",
    orderBy: "modifiedTime desc",
    pageSize: 20,
    fields: "files(id,name,mimeType,modifiedTime)",
  });

  return (response.data.files ?? []).map((f) => ({
    id: f.id!,
    name: f.name!,
    mimeType: f.mimeType!,
    modifiedTime: f.modifiedTime ?? null,
  }));
}

/**
 * Export a Drive file as CSV rows.
 * Sheets are exported via the Drive export API; CSV files are downloaded directly.
 * Returns { headers, rows } in the same shape as the existing CSV parser.
 */
export async function fetchDriveFileAsRows(
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const drive = getDriveClient(accessToken);

  let csvText: string;

  if (mimeType === "application/vnd.google-apps.spreadsheet") {
    // Export Google Sheet as CSV (first sheet)
    const response = await drive.files.export(
      { fileId, mimeType: "text/csv" },
      { responseType: "text" }
    );
    csvText = response.data as string;
  } else {
    // Download raw CSV
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "text" }
    );
    csvText = response.data as string;
  }

  // Parse CSV manually (same logic shape as papaparse)
  const lines = csvText.trim().split("\n");
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });

  return { headers, rows };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/drive/drive-client.ts package.json package-lock.json
git commit -m "feat: add Google Drive API client (list files, fetch as CSV rows)"
```

---

## Task 4: Drive import server actions

**Files:**
- Create: `src/features/imports/drive-import-action.ts`
- Create: `src/features/imports/drive-sync-action.ts`

- [ ] **Step 1: Create `src/features/imports/drive-import-action.ts`**

```typescript
// src/features/imports/drive-import-action.ts
"use server";

import { getServerSession } from "next-auth";
import { authConfig } from "@/features/auth/config";
import { listDriveFiles, fetchDriveFileAsRows, type DriveFileSummary } from "@/lib/drive/drive-client";
import { requireWhitelisted } from "@/features/auth/session";
import { prisma } from "@/lib/db/prisma";

export { type DriveFileSummary };

export async function getDriveFiles(): Promise<DriveFileSummary[]> {
  await requireWhitelisted();
  const session = await getServerSession(authConfig);
  const accessToken = (session as typeof session & { accessToken?: string })?.accessToken;
  if (!accessToken) throw new Error("Google Drive not connected. Please sign out and sign in again.");
  return listDriveFiles(accessToken);
}

export type DriveImportResult = {
  batchId: string;
  headers: string[];
  totalRows: number;
};

export async function importFromDrive(params: {
  fileId: string;
  fileName: string;
  mimeType: string;
  section: string;
  periodId: string;
  kind: "primary" | "supplemental";
}): Promise<DriveImportResult> {
  const session = await requireWhitelisted();
  const nextSession = await getServerSession(authConfig);
  const accessToken = (nextSession as typeof nextSession & { accessToken?: string })?.accessToken;
  if (!accessToken) throw new Error("Google Drive not connected.");

  const { headers, rows } = await fetchDriveFileAsRows(
    accessToken,
    params.fileId,
    params.mimeType
  );

  // Create ImportBatch with sourceKind = drive
  const batch = await prisma.importBatch.create({
    data: {
      section: params.section,
      periodId: params.periodId,
      kind: params.kind,
      filename: params.fileName,
      sourceKind: "drive",
      driveFileId: params.fileId,
      driveFileName: params.fileName,
      uploadedByUserId: session.user.id,
      status: "uploaded",
    },
  });

  // Persist raw rows
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

- [ ] **Step 2: Create `src/features/imports/drive-sync-action.ts`**

```typescript
// src/features/imports/drive-sync-action.ts
"use server";

import { getServerSession } from "next-auth";
import { authConfig } from "@/features/auth/config";
import { fetchDriveFileAsRows } from "@/lib/drive/drive-client";
import { requireWhitelisted } from "@/features/auth/session";
import { prisma } from "@/lib/db/prisma";

export type ResyncResult = {
  headers: string[];
  totalRows: number;
  newColumns: string[];
};

/**
 * Re-sync a Drive-sourced ImportBatch.
 * Only allowed on batches with sourceKind = drive and status != archived.
 * Replaces RawImportRow records. Existing FieldRegistryEntry mappings are preserved.
 */
export async function resyncDriveBatch(batchId: string): Promise<ResyncResult> {
  await requireWhitelisted();

  const batch = await prisma.importBatch.findUnique({ where: { id: batchId } });
  if (!batch) throw new Error("Batch not found");
  if (batch.sourceKind !== "drive") throw new Error("Batch is not a Drive import");
  if (!batch.driveFileId) throw new Error("No Drive file ID on batch");
  if (batch.status === "archived") throw new Error("Cannot re-sync an archived batch");

  const nextSession = await getServerSession(authConfig);
  const accessToken = (nextSession as typeof nextSession & { accessToken?: string })?.accessToken;
  if (!accessToken) throw new Error("Google Drive not connected.");

  const { headers, rows } = await fetchDriveFileAsRows(
    accessToken,
    batch.driveFileId,
    "application/vnd.google-apps.spreadsheet" // Drive API handles CSV too
  );

  // Find previously known columns
  const existingEntries = await prisma.fieldRegistryEntry.findMany({
    where: { section: batch.section, active: true },
    select: { sourceColumnName: true },
  });
  const knownColumns = new Set(existingEntries.map((e) => e.sourceColumnName));
  const newColumns = headers.filter((h) => !knownColumns.has(h));

  // Replace raw rows
  await prisma.$transaction([
    prisma.rawImportRow.deleteMany({ where: { importBatchId: batchId } }),
    prisma.rawImportRow.createMany({
      data: rows.map((row, index) => ({
        importBatchId: batchId,
        rowIndex: index,
        rawJson: JSON.stringify(row),
      })),
    }),
    prisma.importBatch.update({
      where: { id: batchId },
      data: { status: "uploaded" },
    }),
  ]);

  return { headers, totalRows: rows.length, newColumns };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add src/features/imports/drive-import-action.ts src/features/imports/drive-sync-action.ts
git commit -m "feat: add Drive import and re-sync server actions"
```

---

## Task 5: Drive file picker UI + update ImportWorkspace Step 1

**Files:**
- Create: `src/components/imports/drive-file-picker.tsx`
- Create: `src/components/imports/import-source-picker.tsx`
- Modify: `src/components/imports/import-workspace.tsx`

- [ ] **Step 1: Create `src/components/imports/drive-file-picker.tsx`**

```typescript
// src/components/imports/drive-file-picker.tsx
"use client";

import { useEffect, useState } from "react";
import { getDriveFiles, type DriveFileSummary } from "@/features/imports/drive-import-action";

type DriveFilePickerProps = {
  onSelect: (file: DriveFileSummary) => void;
  loading: boolean;
};

export function DriveFilePicker({ onSelect, loading }: DriveFilePickerProps) {
  const [files, setFiles] = useState<DriveFileSummary[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDriveFiles()
      .then(setFiles)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load Drive files"))
      .finally(() => setFetching(false));
  }, []);

  if (fetching) {
    return <p className="py-4 text-center text-sm text-slate-400">Loading Drive files…</p>;
  }

  if (error) {
    return (
      <p className="rounded-[1rem] border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
        {error}
      </p>
    );
  }

  if (files.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-400">No Sheets or CSV files found in Drive.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {files.map((file) => (
        <button
          key={file.id}
          type="button"
          disabled={loading}
          onClick={() => onSelect(file)}
          className="flex items-center justify-between rounded-[1.1rem] border border-white/10 bg-slate-950/50 px-4 py-3 text-left transition hover:border-white/20 disabled:opacity-50"
        >
          <div>
            <p className="text-sm font-medium text-white">{file.name}</p>
            {file.modifiedTime && (
              <p className="mt-0.5 text-xs text-slate-400">
                Modified {new Date(file.modifiedTime).toLocaleDateString()}
              </p>
            )}
          </div>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-white/40">
            {file.mimeType.includes("spreadsheet") ? "Sheet" : "CSV"}
          </span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/imports/import-source-picker.tsx`**

```typescript
// src/components/imports/import-source-picker.tsx
"use client";

import { useState } from "react";
import { UploadStep } from "./upload-step";
import { DriveFilePicker } from "./drive-file-picker";
import type { DriveFileSummary } from "@/features/imports/drive-import-action";

type ImportSourcePickerProps = {
  onCsvSubmit: (formData: FormData) => void;
  onDriveSelect: (file: DriveFileSummary) => void;
  loading: boolean;
};

type Source = "csv" | "drive";

export function ImportSourcePicker({
  onCsvSubmit,
  onDriveSelect,
  loading,
}: ImportSourcePickerProps) {
  const [source, setSource] = useState<Source>("csv");

  return (
    <div className="space-y-4">
      {/* Source toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSource("csv")}
          className={`rounded-full border px-4 py-1.5 text-sm transition ${
            source === "csv"
              ? "border-[var(--accent)]/50 bg-[var(--accent)]/15 text-white"
              : "border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          Upload CSV
        </button>
        <button
          type="button"
          onClick={() => setSource("drive")}
          className={`rounded-full border px-4 py-1.5 text-sm transition ${
            source === "drive"
              ? "border-[var(--accent)]/50 bg-[var(--accent)]/15 text-white"
              : "border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          Google Drive
        </button>
      </div>

      {source === "csv" && <UploadStep onSubmit={onCsvSubmit} loading={loading} />}
      {source === "drive" && (
        <DriveFilePicker onSelect={onDriveSelect} loading={loading} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update `ImportWorkspace` Step 1**

In `src/components/imports/import-workspace.tsx`:

Add the import:

```typescript
import { ImportSourcePicker } from "./import-source-picker";
import { importFromDrive, type DriveFileSummary } from "@/features/imports/drive-import-action";
```

Add a handler for Drive file selection:

```typescript
async function handleDriveSelect(file: DriveFileSummary) {
  if (!uploadedData?.section) return; // section comes from a form field — read it from the form state
  // For Drive, we skip to period selection directly after fetching rows
  setError(null);
  setLoading(true);
  try {
    // We need section and kind from the form — prompt user before opening Drive picker
    // For now: use a default section from uploadedData or a stored pre-selection
    const result = await importFromDrive({
      fileId: file.id,
      fileName: file.name,
      mimeType: file.mimeType,
      section: /* stored section from form */ "academy", // Replace with actual form state
      periodId: selectedPeriodId,
      kind: "primary",
    });
    setUploadedData({
      headers: result.headers,
      totalRows: result.totalRows,
      suggestions: [],
      rawRows: [],
      filename: file.name,
      section: "academy",
      kind: "primary",
    });
    setSavedBatchId(result.batchId);
    setStep(2);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Drive import failed");
  } finally {
    setLoading(false);
  }
}
```

> **Note:** The exact section/kind selection for Drive imports depends on where in the form those fields are collected. Align `handleDriveSelect` to read section/kind from the same form state that `handleUpload` uses. Look at how the existing `UploadStep` form collects `section` and `kind` (via FormData), and apply the same pre-selection pattern to the Drive flow.

Replace the Step 1 JSX block:

```tsx
{step === 1 && (
  <FadeIn>
    <SurfaceCard eyebrow="Step 1" title="Choose data source">
      <ImportSourcePicker
        onCsvSubmit={handleUpload}
        onDriveSelect={handleDriveSelect}
        loading={loading}
      />
    </SurfaceCard>
  </FadeIn>
)}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 5: Verify in browser**

1. Navigate to `/admin/imports`
2. Step 1 shows "Upload CSV" | "Google Drive" toggle
3. Click "Google Drive" — file list loads (requires valid Google session with Drive scope)
4. Select a Sheet — flow advances to Step 2 (period selection)
5. Complete through to Step 4 (field mapping) — same UX as CSV

- [ ] **Step 6: Commit**

```bash
git add src/components/imports/ src/features/imports/
git commit -m "feat: add Google Drive file picker to import workflow Step 1"
```

---

## Task 6: Re-sync UI on import batch

**Files:**
- Modify: `src/app/admin/imports/page.tsx` (or wherever import batches are listed)

- [ ] **Step 1: Add a re-sync button to Drive-sourced batch rows**

In the admin imports list, for any batch where `sourceKind === 'drive'`, render a "Re-sync" button:

```typescript
import { resyncDriveBatch } from "@/features/imports/drive-sync-action";

// In the batch row component:
{batch.sourceKind === "drive" && batch.status !== "archived" && (
  <button
    type="button"
    onClick={async () => {
      const result = await resyncDriveBatch(batch.id);
      // Show success toast or refresh
      if (result.newColumns.length > 0) {
        alert(`Re-synced. ${result.newColumns.length} new columns detected: ${result.newColumns.join(", ")}`);
      }
    }}
    className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400 transition hover:border-[var(--accent)]/40 hover:text-white"
  >
    ↻ Re-sync
  </button>
)}
```

- [ ] **Step 2: Verify in browser**

1. Import a batch from Drive
2. Modify the source Sheet in Google Drive (add a column)
3. Click "Re-sync" on the batch row
4. Verify the new column appears as an unmapped candidate in the field registry

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/imports/
git commit -m "feat: add re-sync button for Drive-sourced import batches"
```

---

## Task 7: PDF export on share/readout page

**Files:**
- Create: `src/lib/pdf/generate-pdf.ts`
- Create: `src/features/reports/pdf-export-action.ts`
- Modify: `src/app/share/output/[shareToken]/page.tsx`

- [ ] **Step 1: Install PDF generation dependency**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting
npm install puppeteer-core @sparticuz/chromium-min
```

- [ ] **Step 2: Create `src/lib/pdf/generate-pdf.ts`**

```typescript
// src/lib/pdf/generate-pdf.ts
// Generates a PDF of a given URL using headless Chromium.
// Uses @sparticuz/chromium-min for a smaller bundle footprint.

import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

export async function generatePdfFromUrl(url: string): Promise<Buffer> {
  const executablePath = await chromium.executablePath(
    "https://github.com/Sparticuz/chromium/releases/download/v130.0.0/chromium-v130.0.0-pack.tar"
  );

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 3: Create `src/features/reports/pdf-export-action.ts`**

```typescript
// src/features/reports/pdf-export-action.ts
"use server";

import { requireWhitelisted } from "@/features/auth/session";
import { generatePdfFromUrl } from "@/lib/pdf/generate-pdf";
import { getServerSession } from "next-auth";
import { authConfig } from "@/features/auth/config";
import { google } from "googleapis";

export async function exportToPdfBuffer(shareToken: string): Promise<string> {
  await requireWhitelisted();

  // Build the absolute share URL
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/share/output/${shareToken}`;

  const buffer = await generatePdfFromUrl(url);
  // Return as base64 so it can be sent to the client for download
  return buffer.toString("base64");
}

export async function exportToDrive(
  shareToken: string,
  reportTitle: string
): Promise<{ driveFileUrl: string }> {
  await requireWhitelisted();

  const nextSession = await getServerSession(authConfig);
  const accessToken = (nextSession as typeof nextSession & { accessToken?: string })?.accessToken;
  if (!accessToken) throw new Error("Google Drive not connected.");

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/share/output/${shareToken}`;
  const buffer = await generatePdfFromUrl(url);

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: "v3", auth });

  const { Readable } = await import("stream");
  const stream = Readable.from(buffer);

  const response = await drive.files.create({
    requestBody: {
      name: `${reportTitle}.pdf`,
      mimeType: "application/pdf",
    },
    media: {
      mimeType: "application/pdf",
      body: stream,
    },
    fields: "id,webViewLink",
  });

  return { driveFileUrl: response.data.webViewLink ?? "" };
}
```

- [ ] **Step 4: Add export buttons to the share page**

In `src/app/share/output/[shareToken]/page.tsx`, add export buttons in the page header area:

```tsx
"use client";
// (convert to client component if it isn't already, or extract a client ExportButtons component)

import { useState } from "react";
import { exportToPdfBuffer, exportToDrive } from "@/features/reports/pdf-export-action";

function ExportButtons({ shareToken, reportTitle }: { shareToken: string; reportTitle: string }) {
  const [exporting, setExporting] = useState(false);

  async function handleDownload() {
    setExporting(true);
    try {
      const base64 = await exportToPdfBuffer(shareToken);
      const blob = new Blob([Buffer.from(base64, "base64")], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportTitle}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function handleSaveToDrive() {
    setExporting(true);
    try {
      const { driveFileUrl } = await exportToDrive(shareToken, reportTitle);
      window.open(driveFileUrl, "_blank");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={exporting}
        onClick={handleDownload}
        className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-slate-300 transition hover:border-white/25 disabled:opacity-50"
      >
        {exporting ? "Generating…" : "↓ Download PDF"}
      </button>
      <button
        type="button"
        disabled={exporting}
        onClick={handleSaveToDrive}
        className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-slate-300 transition hover:border-white/25 disabled:opacity-50"
      >
        {exporting ? "Generating…" : "↑ Save to Drive"}
      </button>
    </div>
  );
}
```

Add `<ExportButtons shareToken={shareToken} reportTitle={outputTitle} />` in the page header alongside the existing share link UI.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/steven/Desktop/Coding/Ledger-Reporting && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 6: Verify in browser**

1. Open an approved output share link: `/share/output/[token]`
2. "Download PDF" and "Save to Drive" buttons appear in the header
3. Click "Download PDF" — PDF downloads to local machine
4. Click "Save to Drive" — file appears in Google Drive, new tab opens to it

- [ ] **Step 7: Commit**

```bash
git add src/lib/pdf/ src/features/reports/pdf-export-action.ts src/app/share/ package.json package-lock.json
git commit -m "feat: PDF export to local machine and Google Drive from share page"
```

---

## Phase 3 Done ✓

At this point:
- Import workspace Step 1 offers CSV upload or Google Drive file picker
- Drive-sourced batches show a re-sync button; re-sync replaces rows and detects new columns
- Approved output share pages have "Download PDF" and "Save to Drive" buttons

Mark this doc status as `Completed` and move to `implementation_phase4.md`.
