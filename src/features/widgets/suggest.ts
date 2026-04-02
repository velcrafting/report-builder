// src/features/widgets/suggest.ts
//
// Pure function: given a fieldRole and fieldType from FieldRegistryEntry,
// return the most appropriate WidgetKind to suggest in the flywheel tray.

import type { WidgetKind } from "./types";

type FieldRole =
  | "kpi"
  | "evidence"
  | "takeaway"
  | "highlightFlag"
  | "classification"
  | "dimension"
  | "metric"
  | "note"
  | "ignored";

type FieldType =
  | "number"
  | "percent"
  | "currency"
  | "text"
  | "date"
  | "status"
  | "tag"
  | "link"
  | "boolean";

export function suggestWidgetKind(
  fieldRole: FieldRole,
  fieldType: FieldType
): WidgetKind {
  if (fieldRole === "kpi") {
    return "kpi_stat";
  }
  if (fieldRole === "metric") {
    if (fieldType === "date") return "time_series";
    if (fieldType === "number" || fieldType === "currency" || fieldType === "percent") {
      return "sparkline";
    }
    return "kpi_stat";
  }
  if (fieldRole === "dimension") {
    return "ranked_bar";
  }
  if (fieldRole === "takeaway") {
    return "text_insight";
  }
  if (fieldRole === "highlightFlag" || fieldRole === "classification") {
    return "callout";
  }
  if (fieldRole === "evidence") {
    return "table";
  }
  if (fieldRole === "note") {
    return "text_insight";
  }
  return "text_insight";
}

export function suggestWidgetLabel(
  fieldRole: FieldRole,
  fieldType: FieldType
): string {
  const kind = suggestWidgetKind(fieldRole, fieldType);
  const labels: Record<WidgetKind, string> = {
    kpi_stat: "KPI Card",
    sparkline: "Sparkline",
    time_series: "Line Chart",
    ranked_bar: "Bar Chart",
    table: "Table",
    text_insight: "Narrative Block",
    callout: "Callout",
    timeline: "Timeline",
    comparison: "Comparison",
    quote: "Quote",
  };
  return labels[kind] ?? "Widget";
}
