import { prisma } from "@/lib/db/prisma";
import { randomUUID } from "crypto";

export type ShareLinkRow = {
  id: string;
  outputVersionId: string;
  token: string;
  label: string | null;
  expiresAt: Date | null;
  createdAt: Date;
};

/** Map a raw Prisma ShareLink record to the public ShareLinkRow shape. */
function toRow(record: {
  id: string;
  outputVersionId: string;
  token: string;
  createdByUserId: string | null;
  active: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}): ShareLinkRow {
  return {
    id: record.id,
    outputVersionId: record.outputVersionId,
    token: record.token,
    // The schema has no label column; expose null so callers render "Unnamed link"
    label: null,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
  };
}

export async function createShareLink(data: {
  outputVersionId: string;
  label?: string;
  expiresAt?: Date;
}): Promise<ShareLinkRow> {
  const record = await prisma.shareLink.create({
    data: {
      outputVersionId: data.outputVersionId,
      token: randomUUID(),
      // createdByUserId is required by the schema; use a sentinel until real auth is wired
      createdByUserId: "system",
      active: true,
      expiresAt: data.expiresAt ?? null,
    },
  });
  return toRow(record);
}

export async function listShareLinksForVersion(
  outputVersionId: string
): Promise<ShareLinkRow[]> {
  const records = await prisma.shareLink.findMany({
    where: { outputVersionId, active: true },
    orderBy: { createdAt: "desc" },
  });
  return records.map(toRow);
}

export async function getShareLinkByToken(
  token: string
): Promise<ShareLinkRow | null> {
  const record = await prisma.shareLink.findUnique({
    where: { token },
  });
  if (!record || !record.active) return null;
  return toRow(record);
}

export async function deleteShareLink(id: string): Promise<void> {
  // Soft-delete by setting active = false so the token cannot be re-used
  await prisma.shareLink.update({
    where: { id },
    data: { active: false },
  });
}
