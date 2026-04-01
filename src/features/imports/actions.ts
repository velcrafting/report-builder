"use server";

import { FieldRole, FieldType } from "@prisma/client";
import { parseCSVString, detectColumnTypes } from "@/lib/csv/parser";
import { createImportBatch, insertRawRows, updateImportBatchStatus } from "@/lib/db/imports";
import { listPeriods, createPeriod } from "@/lib/db/periods";
import {
  listFieldRegistryEntries,
  createFieldRegistryEntry,
  updateFieldRegistryEntry,
  type CreateFieldRegistryEntryInput,
} from "@/lib/db/fieldRegistry";
import { requireWhitelisted } from "@/features/auth/session";

// ---------------------------------------------------------------------------
// uploadCSV
// ---------------------------------------------------------------------------

export type UploadCSVResult = {
  headers: string[];
  totalRows: number;
  suggestions: Awaited<ReturnType<typeof detectColumnTypes>>;
  rawRows: Record<string, string>[];
};

export async function uploadCSV(formData: FormData): Promise<UploadCSVResult> {
  await requireWhitelisted();

  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    throw new Error("No file provided");
  }

  const content = await file.text();
  const parsed = parseCSVString(content);
  const suggestions = detectColumnTypes(parsed.headers, parsed.rows);

  return {
    headers: parsed.headers,
    totalRows: parsed.totalRows,
    suggestions,
    rawRows: parsed.rows,
  };
}

// ---------------------------------------------------------------------------
// saveImportBatch
// ---------------------------------------------------------------------------

export type SaveImportBatchInput = {
  section: string;
  periodId: string;
  filename: string;
  kind: "primary" | "supplemental";
  rawRows: Record<string, string>[];
  notes?: string;
};

export async function saveImportBatch(data: SaveImportBatchInput) {
  const session = await requireWhitelisted();

  const batch = await createImportBatch({
    section: data.section,
    periodId: data.periodId,
    kind: data.kind,
    filename: data.filename,
    uploadedByUserId: session.user.id,
    notes: data.notes,
  });

  await insertRawRows(
    data.rawRows.map((row, i) => ({
      importBatchId: batch.id,
      rowIndex: i,
      rawJson: JSON.stringify(row),
    })),
  );

  return { batchId: batch.id, rowCount: data.rawRows.length };
}

// ---------------------------------------------------------------------------
// saveFieldMappings
// ---------------------------------------------------------------------------

export type MappingEntry = {
  sourceColumnName: string;
  displayLabel: string;
  fieldType: string;
  fieldRole: string;
  widgetEligible: boolean;
};

export type SaveFieldMappingsInput = {
  batchId: string;
  section: string;
  mappings: MappingEntry[];
};

export async function saveFieldMappings(data: SaveFieldMappingsInput) {
  await requireWhitelisted();

  const existing = await listFieldRegistryEntries(data.section);
  const existingByCol = new Map(existing.map((e) => [e.sourceColumnName, e]));

  for (const mapping of data.mappings) {
    const entryData: CreateFieldRegistryEntryInput = {
      section: data.section,
      sourceColumnName: mapping.sourceColumnName,
      internalKey: mapping.sourceColumnName.toLowerCase().replace(/\s+/g, "_"),
      displayLabel: mapping.displayLabel,
      fieldType: mapping.fieldType as FieldType,
      fieldRole: mapping.fieldRole as FieldRole,
      widgetEligible: mapping.widgetEligible,
    };
    const found = existingByCol.get(mapping.sourceColumnName);
    if (found) {
      await updateFieldRegistryEntry(found.id, {
        displayLabel: entryData.displayLabel,
        fieldType: entryData.fieldType,
        fieldRole: entryData.fieldRole,
        widgetEligible: entryData.widgetEligible,
        active: true,
      });
    } else {
      await createFieldRegistryEntry(entryData);
    }
  }

  await updateImportBatchStatus(data.batchId, "mapped");

  return { savedCount: data.mappings.length };
}

// ---------------------------------------------------------------------------
// getPeriodOptions
// ---------------------------------------------------------------------------

export async function getPeriodOptions() {
  return listPeriods();
}

// ---------------------------------------------------------------------------
// createNewPeriod
// ---------------------------------------------------------------------------

export type CreatePeriodData = {
  cadence: "weekly" | "monthly" | "quarterly" | "custom";
  startDate: string;
  endDate: string;
  label: string;
};

export async function createNewPeriod(data: CreatePeriodData) {
  await requireWhitelisted();

  return createPeriod({
    cadence: data.cadence,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    label: data.label,
  });
}
