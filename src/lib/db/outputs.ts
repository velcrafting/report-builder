/**
 * Repository: Outputs
 *
 * Typed loaders and writers for OutputVersion and ShareLink.
 * Outputs are immutable snapshots of approved report drafts.
 */

import { OutputState, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export type OutputVersionRow = Prisma.OutputVersionGetPayload<{
  include: {
    period: true;
    basedOnReportDraft: true;
    approvedByUser: true;
    shareLinks: true;
    supersededBy: true;
  };
}>;

export type OutputVersionSummary = Pick<
  Prisma.OutputVersionGetPayload<Record<string, never>>,
  | "id"
  | "section"
  | "periodId"
  | "versionNumber"
  | "state"
  | "approvedAt"
  | "supersededByOutputId"
  | "createdAt"
>;

export type ShareLinkRow = Prisma.ShareLinkGetPayload<Record<string, never>>;

// ── Output Readers ───────────────────────────────────────────────────────────

export async function listOutputVersions(
  periodId: string,
  section?: string
): Promise<OutputVersionSummary[]> {
  return prisma.outputVersion.findMany({
    where: { periodId, ...(section ? { section } : {}) },
    orderBy: [{ versionNumber: "desc" }],
    select: {
      id: true,
      section: true,
      periodId: true,
      versionNumber: true,
      state: true,
      approvedAt: true,
      supersededByOutputId: true,
      createdAt: true,
    },
  });
}

export async function getOutputVersion(
  id: string
): Promise<OutputVersionRow | null> {
  return prisma.outputVersion.findUnique({
    where: { id },
    include: {
      period: true,
      basedOnReportDraft: true,
      approvedByUser: true,
      shareLinks: true,
      supersededBy: true,
    },
  });
}

/** Return the current active approved output for a section + period (not superseded). */
export async function getApprovedOutput(
  periodId: string,
  section: string
): Promise<OutputVersionSummary | null> {
  return prisma.outputVersion.findFirst({
    where: { periodId, section, state: "approved", supersededByOutputId: null },
    orderBy: { versionNumber: "desc" },
    select: {
      id: true,
      section: true,
      periodId: true,
      versionNumber: true,
      state: true,
      approvedAt: true,
      supersededByOutputId: true,
      createdAt: true,
    },
  });
}

// ── Output Writers ───────────────────────────────────────────────────────────

export type CreateOutputVersionInput = {
  section: string;
  periodId: string;
  versionNumber: number;
  basedOnReportDraftId: string;
  snapshotJson: string;
};

export async function createOutputVersion(
  data: CreateOutputVersionInput
): Promise<OutputVersionSummary> {
  return prisma.outputVersion.create({
    data: { ...data, state: "draft" },
    select: {
      id: true,
      section: true,
      periodId: true,
      versionNumber: true,
      state: true,
      approvedAt: true,
      supersededByOutputId: true,
      createdAt: true,
    },
  });
}

export async function setOutputState(
  id: string,
  state: OutputState
): Promise<OutputVersionSummary> {
  return prisma.outputVersion.update({
    where: { id },
    data: { state },
    select: {
      id: true,
      section: true,
      periodId: true,
      versionNumber: true,
      state: true,
      approvedAt: true,
      supersededByOutputId: true,
      createdAt: true,
    },
  });
}

/** Approve an output: sets state → approved, records approver + timestamp. */
export async function approveOutput(
  id: string,
  approvedByUserId: string
): Promise<OutputVersionSummary> {
  return prisma.outputVersion.update({
    where: { id },
    data: {
      state: "approved",
      approvedByUserId,
      approvedAt: new Date(),
    },
    select: {
      id: true,
      section: true,
      periodId: true,
      versionNumber: true,
      state: true,
      approvedAt: true,
      supersededByOutputId: true,
      createdAt: true,
    },
  });
}

/**
 * Supersede an existing output with a newer version.
 * Marks the old output as superseded and records the superseding ID.
 */
export async function supersedeOutput(
  oldId: string,
  newId: string
): Promise<void> {
  await prisma.outputVersion.update({
    where: { id: oldId },
    data: { state: "superseded", supersededByOutputId: newId },
  });
}

// ── Share Link Readers + Writers ─────────────────────────────────────────────

export async function getShareLinkByToken(
  token: string
): Promise<ShareLinkRow | null> {
  return prisma.shareLink.findUnique({ where: { token } });
}

export type CreateShareLinkInput = {
  outputVersionId: string;
  token: string;
  createdByUserId: string;
  expiresAt?: Date;
};

export async function createShareLink(
  data: CreateShareLinkInput
): Promise<ShareLinkRow> {
  return prisma.shareLink.create({ data });
}

export async function deactivateShareLink(id: string): Promise<ShareLinkRow> {
  return prisma.shareLink.update({
    where: { id },
    data: { active: false },
  });
}
