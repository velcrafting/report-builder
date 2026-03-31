import type { WidgetKind } from "./types";

export type WidgetBundle = {
  id: string;
  label: string;
  description: string;
  widgetKinds: WidgetKind[];
};

export const DEFAULT_FAVORITE_WIDGETS: WidgetKind[] = [
  "kpi_stat",
  "time_series",
  "ranked_bar",
  "text_insight",
  "comparison",
  "timeline",
];

export const widgetBundles: WidgetBundle[] = [
  {
    id: "executive-summary-pack",
    label: "Executive Summary Pack",
    description: "Topline KPI, comparison, and one narrative insight block.",
    widgetKinds: ["kpi_stat", "comparison", "text_insight"],
  },
  {
    id: "evidence-pack",
    label: "Evidence Pack",
    description: "Time series + ranked bar + table for proof-heavy sections.",
    widgetKinds: ["time_series", "ranked_bar", "table"],
  },
  {
    id: "narrative-pack",
    label: "Narrative Pack",
    description: "Insight + callout + quote for interpretation-first reporting.",
    widgetKinds: ["text_insight", "callout", "quote"],
  },
];

const widgetBundleMap = new Map(widgetBundles.map((bundle) => [bundle.id, bundle]));

export function getWidgetBundle(id: string): WidgetBundle | null {
  return widgetBundleMap.get(id) ?? null;
}
