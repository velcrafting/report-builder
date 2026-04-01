"use server";

import { requireWhitelisted } from "@/features/auth/session";
import {
  createShareLink,
  listShareLinksForVersion,
  deleteShareLink,
  type ShareLinkRow,
} from "@/lib/db/shareLinks";

export async function createShareLinkAction(
  outputVersionId: string,
  label?: string
): Promise<ShareLinkRow> {
  await requireWhitelisted();
  return createShareLink({ outputVersionId, label });
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
