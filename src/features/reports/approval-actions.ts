"use server";

import { requireWhitelisted } from "@/features/auth/session";
import { getReportDraft } from "@/lib/db/reportDrafts";
import { prisma } from "@/lib/db/prisma";
import {
  createOutputVersion,
  approveOutput,
  listOutputVersions,
  type OutputVersionSummary,
} from "@/lib/db/outputs";

export type { OutputVersionSummary };

export async function approveDraftAction(
  draftId: string
): Promise<{ outputVersionId: string }> {
  const session = await requireWhitelisted();

  const draft = await getReportDraft(draftId);
  if (!draft) {
    throw new Error("Draft not found");
  }

  if (draft.status !== "in_review") {
    throw new Error("Draft must be in_review to approve");
  }

  // Determine next version number for this draft's section + period
  const existingCount = await prisma.outputVersion.count({
    where: { basedOnReportDraftId: draftId },
  });
  const versionNumber = existingCount + 1;

  // Create the output version snapshot in draft state, then approve it
  const newVersion = await createOutputVersion({
    section: draft.section,
    periodId: draft.periodId,
    versionNumber,
    basedOnReportDraftId: draftId,
    snapshotJson: JSON.stringify(draft),
  });

  await approveOutput(newVersion.id, session.user.id);

  return { outputVersionId: newVersion.id };
}

export async function listOutputVersionsAction(
  draftId: string
): Promise<OutputVersionSummary[]> {
  await requireWhitelisted();
  const draft = await getReportDraft(draftId);
  if (!draft) return [];
  return listOutputVersions(draft.periodId, draft.section);
}
