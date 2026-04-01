"use server";

import { requireWhitelisted } from "@/features/auth/session";
import { createPeriod } from "@/lib/db/periods";
import type { Cadence } from "@prisma/client";

export async function createPeriodAction(data: {
  cadence: Cadence;
  startDate: string;
  endDate: string;
  label: string;
  comparisonPeriodId?: string;
}) {
  await requireWhitelisted();
  return createPeriod({
    cadence: data.cadence,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    label: data.label,
    comparisonPeriodId: data.comparisonPeriodId,
  });
}
