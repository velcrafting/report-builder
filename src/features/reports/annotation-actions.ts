"use server";

import { requireWhitelisted } from "@/features/auth/session";
import {
  listAnnotations,
  createAnnotation as dbCreateAnnotation,
  updateAnnotation as dbUpdateAnnotation,
  deleteAnnotation as dbDeleteAnnotation,
  setAnnotationPromoted,
  type InsightAnnotationSummary,
} from "@/lib/db/annotations";
import { InsightClassification, InsightPriority } from "@prisma/client";

export async function createAnnotation(data: {
  section: string;
  periodId: string;
  title: string;
  body: string;
  classification: string;
  priority: string;
  relatedWidgetId?: string;
}): Promise<InsightAnnotationSummary> {
  const session = await requireWhitelisted();
  return dbCreateAnnotation({
    section: data.section,
    periodId: data.periodId,
    createdByUserId: session.user.id,
    title: data.title,
    body: data.body,
    classification: data.classification as InsightClassification,
    priority: data.priority as InsightPriority,
    relatedWidgetId: data.relatedWidgetId,
  });
}

export async function updateAnnotation(
  id: string,
  patch: {
    title?: string;
    body?: string;
    classification?: string;
    priority?: string;
  }
): Promise<InsightAnnotationSummary> {
  await requireWhitelisted();
  return dbUpdateAnnotation(id, {
    title: patch.title,
    body: patch.body,
    classification: patch.classification as InsightClassification | undefined,
    priority: patch.priority as InsightPriority | undefined,
  });
}

export async function deleteAnnotation(id: string): Promise<void> {
  await requireWhitelisted();
  await dbDeleteAnnotation(id);
}

export async function getAnnotationsForSection(
  section: string,
  periodId: string
): Promise<InsightAnnotationSummary[]> {
  await requireWhitelisted();
  return listAnnotations(periodId, section);
}

export async function toggleRollupPromotion(
  annotationId: string,
  promote: boolean
): Promise<InsightAnnotationSummary> {
  await requireWhitelisted();
  return setAnnotationPromoted(annotationId, promote);
}
