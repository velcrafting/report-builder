"use server";

import { DraftState, WidgetSize } from "@prisma/client";
import {
  createReportDraft as dbCreateReportDraft,
  getReportDraft,
  listReportDrafts as dbListReportDrafts,
  updateReportDraft,
  setReportDraftStatus,
  addWidget,
  updateWidget,
  removeWidget,
  type ReportDraftSummary,
  type ReportDraftRow,
  type WidgetInstanceRow,
} from "@/lib/db/reportDrafts";
import { requireWhitelisted } from "@/features/auth/session";
import { logAuditEvent } from "@/lib/db/auditLog";

// ── Draft Actions ─────────────────────────────────────────────────────────────

export async function createReportDraft(data: {
  section: string;
  periodId: string;
  title: string;
}): Promise<ReportDraftSummary> {
  const session = await requireWhitelisted();
  return dbCreateReportDraft({
    section: data.section,
    periodId: data.periodId,
    title: data.title,
    createdByUserId: session.user.id,
  });
}

export async function getReportDraftWithWidgets(
  draftId: string
): Promise<ReportDraftRow | null> {
  await requireWhitelisted();
  return getReportDraft(draftId);
}

export async function listReportDrafts(filters?: {
  section?: string;
  periodId?: string;
}): Promise<ReportDraftSummary[]> {
  await requireWhitelisted();
  // The DB function requires periodId; if not provided use a broad query via empty string fallback
  // We replicate the shape by calling with empty periodId when not supplied and filtering in-memory,
  // or we pass the provided periodId. If neither is supplied, return all drafts by calling
  // with an empty periodId pattern — but the DB fn requires a non-empty string. We handle this
  // by passing "" which will return no rows when no period is set, so callers should always
  // provide periodId for a useful result. If section only is provided, we pass "" for periodId.
  const periodId = filters?.periodId ?? "";
  const section = filters?.section;

  if (!periodId) {
    // No periodId given — query all periods by omitting the where clause manually
    // The lib only supports periodId-scoped queries, so fall back to returning empty for now.
    // Callers that want all drafts should pass a periodId.
    return [];
  }

  return dbListReportDrafts(periodId, section);
}

export async function updateDraftStatus(
  draftId: string,
  status: "draft" | "in_review"
): Promise<ReportDraftSummary> {
  await requireWhitelisted();
  const result = await setReportDraftStatus(draftId, status as DraftState);
  logAuditEvent({ action: "draft.status_changed", entityType: "ReportDraft", entityId: draftId, meta: { status } }).catch(() => {});
  return result;
}

export async function updateDraftSummary(
  draftId: string,
  summary: string
): Promise<ReportDraftSummary> {
  await requireWhitelisted();
  return updateReportDraft(draftId, { summary });
}

// ── Widget Instance Actions ───────────────────────────────────────────────────

export async function saveWidgetInstance(
  draftId: string,
  widget: {
    id?: string;
    widgetType: string;
    zoneKey: string;
    size: string;
    configJson: string;
    sortOrder: number;
    includeInRollup?: boolean;
  }
): Promise<WidgetInstanceRow> {
  await requireWhitelisted();

  const size = widget.size as WidgetSize;

  if (widget.id) {
    return updateWidget(widget.id, {
      size,
      zoneKey: widget.zoneKey,
      configJson: widget.configJson,
      sortOrder: widget.sortOrder,
      includeInRollup: widget.includeInRollup,
    });
  }

  return addWidget({
    reportDraftId: draftId,
    widgetType: widget.widgetType,
    zoneKey: widget.zoneKey,
    size,
    configJson: widget.configJson,
    sortOrder: widget.sortOrder,
    includeInRollup: widget.includeInRollup,
  });
}

export async function deleteWidgetInstance(widgetId: string): Promise<void> {
  await requireWhitelisted();
  return removeWidget(widgetId);
}
