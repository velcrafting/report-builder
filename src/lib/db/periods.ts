/**
 * Repository: Periods
 *
 * Typed loaders and writers for the Period model.
 */

import { Cadence, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export type PeriodRow = Prisma.PeriodGetPayload<{
  include: { comparisonPeriod: true };
}>;

export type PeriodSummary = Pick<
  PeriodRow,
  "id" | "cadence" | "startDate" | "endDate" | "label" | "comparisonPeriodId"
>;

// ── Readers ──────────────────────────────────────────────────────────────────

/** Return all periods, newest start date first. */
export async function listPeriods(): Promise<PeriodSummary[]> {
  return prisma.period.findMany({
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      cadence: true,
      startDate: true,
      endDate: true,
      label: true,
      comparisonPeriodId: true,
    },
  });
}

/** Return a single period with its comparison period included. */
export async function getPeriod(id: string): Promise<PeriodRow | null> {
  return prisma.period.findUnique({
    where: { id },
    include: { comparisonPeriod: true },
  });
}

/** Return the most recently started period for a given cadence. */
export async function getLatestPeriodByCadence(
  cadence: Cadence
): Promise<PeriodSummary | null> {
  return prisma.period.findFirst({
    where: { cadence },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      cadence: true,
      startDate: true,
      endDate: true,
      label: true,
      comparisonPeriodId: true,
    },
  });
}

// ── Writers ──────────────────────────────────────────────────────────────────

export type CreatePeriodInput = {
  cadence: Cadence;
  startDate: Date;
  endDate: Date;
  label: string;
  comparisonPeriodId?: string;
};

export async function createPeriod(
  data: CreatePeriodInput
): Promise<PeriodSummary> {
  return prisma.period.create({
    data,
    select: {
      id: true,
      cadence: true,
      startDate: true,
      endDate: true,
      label: true,
      comparisonPeriodId: true,
    },
  });
}

export type UpdatePeriodInput = Partial<
  Omit<CreatePeriodInput, "cadence">
> & { cadence?: Cadence };

export async function updatePeriod(
  id: string,
  data: UpdatePeriodInput
): Promise<PeriodSummary> {
  return prisma.period.update({
    where: { id },
    data,
    select: {
      id: true,
      cadence: true,
      startDate: true,
      endDate: true,
      label: true,
      comparisonPeriodId: true,
    },
  });
}
