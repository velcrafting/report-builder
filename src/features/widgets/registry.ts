import type { WidgetDefinition, WidgetKind } from "./types";

export const widgetDefinitions: WidgetDefinition[] = [
  {
    kind: "kpi_stat",
    label: "KPI stat card",
    layer: "metric",
    defaultRenderMode: "card",
    supportedRenderModes: ["card", "bar"],
  },
  {
    kind: "sparkline",
    label: "Sparkline card",
    layer: "metric",
    defaultRenderMode: "card",
    supportedRenderModes: ["card"],
  },
  {
    kind: "time_series",
    label: "Time series chart",
    layer: "metric",
    defaultRenderMode: "bar",
    supportedRenderModes: ["bar", "card"],
  },
  {
    kind: "ranked_bar",
    label: "Ranked bar chart",
    layer: "metric",
    defaultRenderMode: "bar",
    supportedRenderModes: ["bar", "card"],
  },
  {
    kind: "table",
    label: "Table grid",
    layer: "metric",
    defaultRenderMode: "card",
    supportedRenderModes: ["card"],
  },
  {
    kind: "text_insight",
    label: "Text insight block",
    layer: "narrative",
    defaultRenderMode: "card",
    supportedRenderModes: ["card", "quote"],
  },
  {
    kind: "callout",
    label: "Callout box",
    layer: "narrative",
    defaultRenderMode: "card",
    supportedRenderModes: ["card", "quote"],
  },
  {
    kind: "timeline",
    label: "Timeline rail",
    layer: "structural",
    defaultRenderMode: "card",
    supportedRenderModes: ["card", "bar"],
  },
  {
    kind: "comparison",
    label: "Comparison card",
    layer: "narrative",
    defaultRenderMode: "bar",
    supportedRenderModes: ["bar", "card"],
  },
  {
    kind: "quote",
    label: "Quote block",
    layer: "narrative",
    defaultRenderMode: "quote",
    supportedRenderModes: ["quote", "card"],
  },
];

const widgetDefinitionMap = new Map(widgetDefinitions.map((definition) => [definition.kind, definition]));

export function getWidgetDefinition(kind: WidgetKind): WidgetDefinition {
  return widgetDefinitionMap.get(kind) ?? widgetDefinitionMap.get("text_insight")!;
}
