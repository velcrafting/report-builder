/**
 * Repository: Insight Annotations
 *
 * Typed loaders and writers for InsightAnnotation.
 */

import {
  InsightClassification,
  InsightPriority,
  Prisma,
} from "@prisma/client";
import { prisma } from "./prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export type InsightAnnotationRow =
  Prisma.InsightAnnotationGetPayload<{ include: { createdByUser: true } }>;

export type InsightAnnotationSummary = Pick<
  Prisma.InsightAnnotationGetPayload<Record<string, never>>,
  | "id"
  | "section"
  | "periodId"
  | "title"
  | "body"
  | "classification"
  | "priority"
  | "promotedToRollup"
  | "relatedRecordId"
  | "relatedWidgetId"
  | "createdAt"
>;

// ── Readers ──────────────────────────────────────────────────────────────────

export async function listAnnotations(
  periodId: string,
  section?: string
): Promise<InsightAnnotationSummary[]> {
  return prisma.insightAnnotation.findMany({
    where: { periodId, ...(section ? { section } : {}) },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      section: true,
      periodId: true,
      title: true,
      body: true,
      classification: true,
      priority: true,
      promotedToRollup: true,
      relatedRecordId: true,
      relatedWidgetId: true,
      createdAt: true,
    },
  });
}

/** Return annotations marked for rollup promotion. */
export async function listPromotedAnnotations(
  periodId: string
): Promise<InsightAnnotationSummary[]> {
  return prisma.insightAnnotation.findMany({
    where: { periodId, promotedToRollup: true },
    orderBy: [{ priority: "desc" }, { classification: "asc" }],
    select: {
      id: true,
      section: true,
      periodId: true,
      title: true,
      body: true,
      classification: true,
      priority: true,
      promotedToRollup: true,
      relatedRecordId: true,
      relatedWidgetId: true,
      createdAt: true,
    },
  });
}

export async function getAnnotation(
  id: string
): Promise<InsightAnnotationRow | null> {
  return prisma.insightAnnotation.findUnique({
    where: { id },
    include: { createdByUser: true },
  });
}

// ── Writers ──────────────────────────────────────────────────────────────────

export type CreateAnnotationInput = {
  section: string;
  periodId: string;
  createdByUserId: string;
  title: string;
  body: string;
  classification?: InsightClassification;
  priority?: InsightPriority;
  relatedRecordId?: string;
  relatedWidgetId?: string;
};

export async function createAnnotation(
  data: CreateAnnotationInput
): Promise<InsightAnnotationSummary> {
  return prisma.insightAnnotation.create({
    data,
    select: {
      id: true,
      section: true,
      periodId: true,
      title: true,
      body: true,
      classification: true,
      priority: true,
      promotedToRollup: true,
      relatedRecordId: true,
      relatedWidgetId: true,
      createdAt: true,
    },
  });
}

export type UpdateAnnotationInput = {
  title?: string;
  body?: string;
  classification?: InsightClassification;
  priority?: InsightPriority;
};

export async function updateAnnotation(
  id: string,
  data: UpdateAnnotationInput
): Promise<InsightAnnotationSummary> {
  return prisma.insightAnnotation.update({
    where: { id },
    data,
    select: {
      id: true,
      section: true,
      periodId: true,
      title: true,
      body: true,
      classification: true,
      priority: true,
      promotedToRollup: true,
      relatedRecordId: true,
      relatedWidgetId: true,
      createdAt: true,
    },
  });
}

export async function setAnnotationPromoted(
  id: string,
  promotedToRollup: boolean
): Promise<InsightAnnotationSummary> {
  return prisma.insightAnnotation.update({
    where: { id },
    data: { promotedToRollup },
    select: {
      id: true,
      section: true,
      periodId: true,
      title: true,
      body: true,
      classification: true,
      priority: true,
      promotedToRollup: true,
      relatedRecordId: true,
      relatedWidgetId: true,
      createdAt: true,
    },
  });
}

export async function deleteAnnotation(id: string): Promise<void> {
  await prisma.insightAnnotation.delete({ where: { id } });
}
