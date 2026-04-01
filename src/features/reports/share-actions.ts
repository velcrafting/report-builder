"use server";

import { requireWhitelisted } from "@/features/auth/session";
import {
  createShareLink,
  listShareLinksForVersion,
  deleteShareLink,
  type ShareLinkRow,
} from "@/lib/db/shareLinks";
import { logAuditEvent } from "@/lib/db/auditLog";

export async function createShareLinkAction(
  outputVersionId: string,
  label?: string
): Promise<ShareLinkRow> {
  await requireWhitelisted();
  const link = await createShareLink({ outputVersionId, label });
  logAuditEvent({ action: "share_link.created", entityType: "ShareLink", entityId: link.id, meta: { outputVersionId } }).catch(() => {});
  return link;
}

export async function listShareLinksAction(
  outputVersionId: string
): Promise<ShareLinkRow[]> {
  await requireWhitelisted();
  return listShareLinksForVersion(outputVersionId);
}

export async function deleteShareLinkAction(shareLinkId: string): Promise<void> {
  await requireWhitelisted();
  await deleteShareLink(shareLinkId);
}
