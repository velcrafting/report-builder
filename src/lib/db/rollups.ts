/**
 * Repository: Rollup Versions
 *
 * Typed loaders and writers for the RollupVersion model.
 * Rollups are executive-level aggregations of approved section outputs.
 */

import { OutputState, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export type RollupVersionRow = Prisma.RollupVersionGetPayload<{
  include: {
    period: true;
    createdByUser: true;
    approvedByUser: true;
  };
}>;

export type RollupVersionSummary = Pick<
  Prisma.RollupVersionGetPayload<Record<string, never>>,
  | "id"
  | "periodId"
  | "title"
  | "state"
  | "sourceOutputIdsJson"
  | "createdAt"
  | "updatedAt"
>;

// ── Readers ──────────────────────────────────────────────────────────────────

export async function listRollupVersions(
  periodId: string
): Promise<RollupVersionSummary[]> {
  return prisma.rollupVersion.findMany({
    where: { periodId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      periodId: true,
      title: true,
      state: true,
      sourceOutputIdsJson: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getRollupVersion(
  id: string
): Promise<RollupVersionRow | null> {
  return prisma.rollupVersion.findUnique({
    where: { id },
    include: {
      period: true,
      createdByUser: true,
      approvedByUser: true,
    },
  });
}

/** Return the current active approved rollup for a period. */
export async function getApprovedRollup(
  periodId: string
): Promise<RollupVersionSummary | null> {
  return prisma.rollupVersion.findFirst({
    where: { periodId, state: "approved" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      periodId: true,
      title: true,
      state: true,
      sourceOutputIdsJson: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// ── Writers ──────────────────────────────────────────────────────────────────

export type CreateRollupVersionInput = {
  periodId: string;
  title: string;
  /** JSON-serialized string[]. Caller must stringify before passing. */
  sourceOutputIdsJson: string;
  snapshotJson: string;
  createdByUserId: string;
};

export async function createRollupVersion(
  data: CreateRollupVersionInput
): Promise<RollupVersionSummary> {
  return prisma.rollupVersion.create({
    data: { ...data, state: "draft" },
    select: {
      id: true,
      periodId: true,
      title: true,
      state: true,
      sourceOutputIdsJson: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export type UpdateRollupVersionInput = {
  title?: string;
  snapshotJson?: string;
  sourceOutputIdsJson?: string;
};

export async function updateRollupVersion(
  id: string,
  data: UpdateRollupVersionInput
): Promise<RollupVersionSummary> {
  return prisma.rollupVersion.update({
    where: { id },
    data,
    select: {
      id: true,
      periodId: true,
      title: true,
      state: true,
      sourceOutputIdsJson: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function setRollupState(
  id: string,
  state: OutputState
): Promise<RollupVersionSummary> {
  return prisma.rollupVersion.update({
    where: { id },
    data: { state },
    select: {
      id: true,
      periodId: true,
      title: true,
      state: true,
      sourceOutputIdsJson: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function approveRollup(
  id: string,
  approvedByUserId: string
): Promise<RollupVersionSummary> {
  return prisma.rollupVersion.update({
    where: { id },
    data: { state: "approved", approvedByUserId },
    select: {
      id: true,
      periodId: true,
      title: true,
      state: true,
      sourceOutputIdsJson: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
