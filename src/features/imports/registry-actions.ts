"use server";

import { requireWhitelisted } from "@/features/auth/session";
import {
  listFieldRegistryEntries,
  updateFieldRegistryEntry,
  deactivateFieldRegistryEntry,
} from "@/lib/db/fieldRegistry";
import type { FieldRole, FieldType } from "@prisma/client";

export async function getRegistryForSection(section: string) {
  await requireWhitelisted();
  return listFieldRegistryEntries(section);
}

export async function updateRegistryEntry(
  id: string,
  patch: {
    displayLabel?: string;
    fieldRole?: FieldRole;
    fieldType?: FieldType;
    widgetEligible?: boolean;
    active?: boolean;
  }
) {
  await requireWhitelisted();
  return updateFieldRegistryEntry(id, patch);
}

export async function deactivateEntry(id: string) {
  await requireWhitelisted();
  return deactivateFieldRegistryEntry(id);
}
