// src/features/imports/field-suggestions-action.ts
"use server";

import { listWidgetEligibleFields } from "@/lib/db/fieldRegistry";
import { requireWhitelisted } from "@/features/auth/session";
import { suggestWidgetKind, suggestWidgetLabel } from "@/features/widgets/suggest";
import type { WidgetKind } from "@/features/widgets/types";

export type FieldSuggestion = {
  id: string;
  internalKey: string;
  displayLabel: string;
  fieldRole: string;
  fieldType: string;
  suggestedWidgetKind: WidgetKind;
  suggestedWidgetLabel: string;
};

export async function getFieldSuggestionsForSection(
  section: string
): Promise<FieldSuggestion[]> {
  await requireWhitelisted();

  const entries = await listWidgetEligibleFields(section);

  return entries.map((entry) => ({
    id: entry.id,
    internalKey: entry.internalKey,
    displayLabel: entry.displayLabel,
    fieldRole: entry.fieldRole,
    fieldType: entry.fieldType,
    suggestedWidgetKind: suggestWidgetKind(
      entry.fieldRole as Parameters<typeof suggestWidgetKind>[0],
      entry.fieldType as Parameters<typeof suggestWidgetKind>[1]
    ),
    suggestedWidgetLabel: suggestWidgetLabel(
      entry.fieldRole as Parameters<typeof suggestWidgetLabel>[0],
      entry.fieldType as Parameters<typeof suggestWidgetLabel>[1]
    ),
  }));
}
