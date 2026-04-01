/**
 * Repository: Imports
 *
 * Typed loaders and writers for ImportBatch, RawImportRow,
 * and NormalizedRecord models.
 */

import { ImportKind, ImportStatus, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export type ImportBatchRow = Prisma.ImportBatchGetPayload<{
  include: { uploadedByUser: true };
}>;

export type ImportBatchSummary = Pick<
  Prisma.ImportBatchGetPayload<Record<string, never>>,
  "id" | "section" | "periodId" | "kind" | "filename" | "status" | "uploadedAt" | "notes"
>;

export type RawImportRowData = Prisma.RawImportRowGetPayload<Record<string, never>>;

export type NormalizedRecordData = Prisma.NormalizedRecordGetPayload<Record<string, never>>;

// ── Import Batch Readers ─────────────────────────────────────────────────────

export async function listImportBatches(
  periodId: string,
  section?: string
): Promise<ImportBatchSummary[]> {
  return prisma.importBatch.findMany({
    where: { periodId, ...(section ? { section } : {}) },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      section: true,
      periodId: true,
      kind: true,
      filename: true,
      status: true,
      uploadedAt: true,
      notes: true,
    },
  });
}

export async function getImportBatch(id: string): Promise<ImportBatchRow | null> {
  return prisma.importBatch.findUnique({
    where: { id },
    include: { uploadedByUser: true },
  });
}

// ── Import Batch Writers ─────────────────────────────────────────────────────

export type CreateImportBatchInput = {
  section: string;
  periodId: string;
  kind: ImportKind;
  filename: string;
  uploadedByUserId: string;
  notes?: string;
};

export async function createImportBatch(
  data: CreateImportBatchInput
): Promise<ImportBatchSummary> {
  return prisma.importBatch.create({
    data: { ...data, status: "uploaded" },
    select: {
      id: true,
      section: true,
      periodId: true,
      kind: true,
      filename: true,
      status: true,
      uploadedAt: true,
      notes: true,
    },
  });
}

export async function updateImportBatchStatus(
  id: string,
  status: ImportStatus
): Promise<ImportBatchSummary> {
  return prisma.importBatch.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      section: true,
      periodId: true,
      kind: true,
      filename: true,
      status: true,
      uploadedAt: true,
      notes: true,
    },
  });
}

// ── Raw Row Writers ──────────────────────────────────────────────────────────

export type CreateRawRowInput = {
  importBatchId: string;
  rowIndex: number;
  rawJson: string;
};

/** Bulk-insert raw rows from a CSV parse pass. */
export async function insertRawRows(
  rows: CreateRawRowInput[]
): Promise<{ count: number }> {
  return prisma.rawImportRow.createMany({ data: rows });
}

export async function listRawRows(
  importBatchId: string
): Promise<RawImportRowData[]> {
  return prisma.rawImportRow.findMany({
    where: { importBatchId },
    orderBy: { rowIndex: "asc" },
  });
}

// ── Normalized Record Writers ────────────────────────────────────────────────

export type CreateNormalizedRecordInput = {
  section: string;
  periodId: string;
  importBatchId: string;
  sourceRowId: string;
  normalizedJson: string;
};

export async function insertNormalizedRecords(
  records: CreateNormalizedRecordInput[]
): Promise<{ count: number }> {
  return prisma.normalizedRecord.createMany({ data: records });
}

export async function listNormalizedRecords(
  periodId: string,
  section: string
): Promise<NormalizedRecordData[]> {
  return prisma.normalizedRecord.findMany({
    where: { periodId, section },
    orderBy: { createdAt: "asc" },
  });
}
