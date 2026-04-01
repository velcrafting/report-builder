/**
 * Repository: Field Registry
 *
 * Typed loaders and writers for FieldRegistryEntry.
 */

import { FieldType, FieldRole, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export type FieldRegistryEntryRow =
  Prisma.FieldRegistryEntryGetPayload<Record<string, never>>;

// ── Readers ──────────────────────────────────────────────────────────────────

/** List all active field registry entries, optionally filtered by section. */
export async function listFieldRegistryEntries(
  section?: string
): Promise<FieldRegistryEntryRow[]> {
  return prisma.fieldRegistryEntry.findMany({
    where: {
      active: true,
      ...(section ? { section } : {}),
    },
    orderBy: [{ section: "asc" }, { displayLabel: "asc" }],
  });
}

/** List only widget-eligible entries for a section (used by builder widget picker). */
export async function listWidgetEligibleFields(
  section: string
): Promise<FieldRegistryEntryRow[]> {
  return prisma.fieldRegistryEntry.findMany({
    where: { section, active: true, widgetEligible: true },
    orderBy: { displayLabel: "asc" },
  });
}

export async function getFieldRegistryEntry(
  id: string
): Promise<FieldRegistryEntryRow | null> {
  return prisma.fieldRegistryEntry.findUnique({ where: { id } });
}

/** Look up an entry by its internal key (used during normalization). */
export async function getFieldByInternalKey(
  internalKey: string
): Promise<FieldRegistryEntryRow | null> {
  return prisma.fieldRegistryEntry.findFirst({ where: { internalKey } });
}

// ── Writers ──────────────────────────────────────────────────────────────────

export type CreateFieldRegistryEntryInput = {
  section: string;
  sourceColumnName: string;
  internalKey: string;
  displayLabel: string;
  fieldType: FieldType;
  fieldRole: FieldRole;
  widgetEligible?: boolean;
  editableInApp?: boolean;
};

export async function createFieldRegistryEntry(
  data: CreateFieldRegistryEntryInput
): Promise<FieldRegistryEntryRow> {
  return prisma.fieldRegistryEntry.create({ data });
}

export type UpdateFieldRegistryEntryInput = Partial<
  Omit<CreateFieldRegistryEntryInput, "section" | "internalKey">
> & { active?: boolean };

export async function updateFieldRegistryEntry(
  id: string,
  data: UpdateFieldRegistryEntryInput
): Promise<FieldRegistryEntryRow> {
  return prisma.fieldRegistryEntry.update({ where: { id }, data });
}

/** Soft-delete by setting active = false. */
export async function deactivateFieldRegistryEntry(
  id: string
): Promise<FieldRegistryEntryRow> {
  return prisma.fieldRegistryEntry.update({
    where: { id },
    data: { active: false },
  });
}
