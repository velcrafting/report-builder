"use server";

import { requireWhitelisted } from "@/features/auth/session";
import { getOutputVersion } from "@/lib/db/outputs";
import { getSectionLabel } from "@/config/sections";
import {
  createRollupVersion,
  listRollupVersions,
  type RollupVersionSummary,
} from "@/lib/db/rollups";

// ── Create ────────────────────────────────────────────────────────────────────

export async function createRollupAction(data: {
  periodId: string;
  title: string;
  sourceOutputIds: string[];
}): Promise<{ id: string }> {
  const session = await requireWhitelisted();

  // Fetch each selected OutputVersion to build the composite snapshot
  const outputRows = await Promise.all(
    data.sourceOutputIds.map((id) => getOutputVersion(id))
  );

  const sections = outputRows
    .filter((row) => row !== null)
    .map((row) => ({
      sectionLabel: getSectionLabel(row!.section),
      versionNumber: row!.versionNumber,
      // OutputVersionRow includes basedOnReportDraft with a summary field
      summary:
        (row!.basedOnReportDraft as { summary?: string } | null)?.summary ??
        null,
    }));

  const snapshotJson = JSON.stringify({
    periodId: data.periodId,
    createdAt: new Date().toISOString(),
    sections,
  });

  const created = await createRollupVersion({
    periodId: data.periodId,
    title: data.title,
    sourceOutputIdsJson: JSON.stringify(data.sourceOutputIds),
    snapshotJson,
    createdByUserId: session.user.id,
  });

  return { id: created.id };
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listRollupsAction(
  periodId: string
): Promise<RollupVersionSummary[]> {
  await requireWhitelisted();
  return listRollupVersions(periodId);
}
