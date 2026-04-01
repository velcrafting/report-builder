/**
 * Repository: Report Drafts
 *
 * Typed loaders and writers for ReportDraft and WidgetInstance models.
 */

import { DraftState, WidgetSize, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export type ReportDraftRow = Prisma.ReportDraftGetPayload<{
  include: { widgets: true; createdByUser: true };
}>;

export type ReportDraftSummary = Pick<
  Prisma.ReportDraftGetPayload<Record<string, never>>,
  "id" | "section" | "periodId" | "status" | "title" | "summary" | "createdAt" | "updatedAt"
>;

export type WidgetInstanceRow =
  Prisma.WidgetInstanceGetPayload<Record<string, never>>;

// ── Draft Readers ────────────────────────────────────────────────────────────

export async function listReportDrafts(
  periodId: string,
  section?: string
): Promise<ReportDraftSummary[]> {
  return prisma.reportDraft.findMany({
    where: { periodId, ...(section ? { section } : {}) },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      section: true,
      periodId: true,
      status: true,
      title: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/** Return a full draft including all widgets and creator info. */
export async function getReportDraft(
  id: string
): Promise<ReportDraftRow | null> {
  return prisma.reportDraft.findUnique({
    where: { id },
    include: {
      widgets: { orderBy: { sortOrder: "asc" } },
      createdByUser: true,
    },
  });
}

/** Return the most recent draft for a given section + period. */
export async function getLatestReportDraft(
  periodId: string,
  section: string
): Promise<ReportDraftSummary | null> {
  return prisma.reportDraft.findFirst({
    where: { periodId, section },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      section: true,
      periodId: true,
      status: true,
      title: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// ── Draft Writers ────────────────────────────────────────────────────────────

export type CreateReportDraftInput = {
  section: string;
  periodId: string;
  createdByUserId: string;
  title: string;
  summary?: string;
};

export async function createReportDraft(
  data: CreateReportDraftInput
): Promise<ReportDraftSummary> {
  return prisma.reportDraft.create({
    data: { ...data, status: "draft" },
    select: {
      id: true,
      section: true,
      periodId: true,
      status: true,
      title: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export type UpdateReportDraftInput = {
  title?: string;
  summary?: string;
};

export async function updateReportDraft(
  id: string,
  data: UpdateReportDraftInput
): Promise<ReportDraftSummary> {
  return prisma.reportDraft.update({
    where: { id },
    data,
    select: {
      id: true,
      section: true,
      periodId: true,
      status: true,
      title: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function setReportDraftStatus(
  id: string,
  status: DraftState
): Promise<ReportDraftSummary> {
  return prisma.reportDraft.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      section: true,
      periodId: true,
      status: true,
      title: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// ── Widget Instance Writers ──────────────────────────────────────────────────

export type CreateWidgetInstanceInput = {
  reportDraftId: string;
  widgetType: string;
  zoneKey: string;
  size: WidgetSize;
  configJson: string;
  sortOrder: number;
  includeInRollup?: boolean;
};

export async function addWidget(
  data: CreateWidgetInstanceInput
): Promise<WidgetInstanceRow> {
  return prisma.widgetInstance.create({ data });
}

export type UpdateWidgetInstanceInput = {
  size?: WidgetSize;
  configJson?: string;
  sortOrder?: number;
  includeInRollup?: boolean;
  zoneKey?: string;
};

export async function updateWidget(
  id: string,
  data: UpdateWidgetInstanceInput
): Promise<WidgetInstanceRow> {
  return prisma.widgetInstance.update({ where: { id }, data });
}

export async function removeWidget(id: string): Promise<void> {
  await prisma.widgetInstance.delete({ where: { id } });
}

/** Bulk-replace all widgets for a draft — used when the builder saves full layout state. */
export async function replaceWidgets(
  reportDraftId: string,
  widgets: Omit<CreateWidgetInstanceInput, "reportDraftId">[]
): Promise<void> {
  await prisma.$transaction([
    prisma.widgetInstance.deleteMany({ where: { reportDraftId } }),
    prisma.widgetInstance.createMany({
      data: widgets.map((w) => ({ ...w, reportDraftId })),
    }),
  ]);
}
