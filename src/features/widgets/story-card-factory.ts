import type { ReportSnapshot } from "@/features/reports/types";
import type { WidgetConfig, WidgetKind } from "./types";

type StoryCard = ReportSnapshot["storyBlocks"][number]["cards"][number];

type StoryCardCreateOptions = {
  id: string;
  title?: string;
  body?: string;
  metric?: string;
  supportingLabel?: string;
  widgetConfig?: WidgetConfig;
  widgetData?: Record<string, unknown>;
};

export function createStoryCardFromWidgetKind(
  kind: WidgetKind,
  options: StoryCardCreateOptions,
): StoryCard {
  const base: StoryCard = {
    id: options.id,
    eyebrow: "Context",
    title: options.title ?? "New report block",
    body: options.body ?? "Describe the evidence and why this block matters in the section narrative.",
    metric: options.metric,
    supportingLabel: options.supportingLabel,
    widgetType: kind,
    widgetConfig: options.widgetConfig,
    widgetData: options.widgetData,
  };

  if (kind === "comparison") {
    return {
      ...base,
      eyebrow: "Comparison",
      title: options.title ?? "Quarter-over-quarter movement",
      body:
        options.body ??
        "This block captures movement relative to the prior period and why it shifted.",
      metric: options.metric ?? "+12%",
      supportingLabel: options.supportingLabel ?? "vs prior quarter",
    };
  }

  if (kind === "quote") {
    return {
      ...base,
      eyebrow: "Executive quote",
      title: options.title ?? "What leadership should remember",
      body:
        options.body ??
        "Add a short strategic takeaway that executives can repeat and act on.",
      supportingLabel: options.supportingLabel ?? "Narrative priority",
    };
  }

  if (kind === "timeline") {
    return {
      ...base,
      eyebrow: "Timeline",
      title: options.title ?? "Milestones and checkpoints",
      body: options.body ?? "Track sequence, dependencies, and ownership across this reporting window.",
    };
  }

  if (kind === "kpi_stat") {
    return {
      ...base,
      eyebrow: "KPI",
      title: options.title ?? "Topline KPI",
      body: options.body ?? "Primary metric with contextual delta for executive scanning.",
      metric: options.metric ?? "1.42M",
      supportingLabel: options.supportingLabel ?? "+12% vs prior period",
    };
  }

  if (kind === "sparkline") {
    return {
      ...base,
      eyebrow: "Sparkline",
      title: options.title ?? "Short trend pulse",
      body: options.body ?? "Compact trend summary for fast signal checks.",
      metric: options.metric ?? "284",
      supportingLabel: options.supportingLabel ?? "Last 7 days",
    };
  }

  if (kind === "time_series") {
    return {
      ...base,
      eyebrow: "Time series",
      title: options.title ?? "Volume over time",
      body: options.body ?? "Trend line across reporting window with comparison context.",
      metric: options.metric ?? "+9.4%",
      supportingLabel: options.supportingLabel ?? "Daily granularity",
    };
  }

  if (kind === "ranked_bar") {
    return {
      ...base,
      eyebrow: "Ranked comparison",
      title: options.title ?? "Top categories",
      body: options.body ?? "Category ranking with emphasis on strongest contributors.",
      supportingLabel: options.supportingLabel ?? "Top 5 + Other",
    };
  }

  if (kind === "callout") {
    return {
      ...base,
      eyebrow: "Callout",
      title: options.title ?? "Action-required highlight",
      body: options.body ?? "Use this to flag urgency, caveats, or key recommendations.",
      supportingLabel: options.supportingLabel ?? "Severity: medium",
    };
  }

  if (kind === "table") {
    return {
      ...base,
      eyebrow: "Evidence table",
      title: options.title ?? "Structured supporting evidence",
      body: options.body ?? "Use sortable evidence rows to back findings and preserve source detail.",
    };
  }

  return base;
}

export function inferWidgetKindFromCard(card: StoryCard): WidgetKind {
  if (card.widgetType) {
    return card.widgetType;
  }

  const label = `${card.eyebrow} ${card.title}`.toLowerCase();

  if (label.includes("comparison") || label.includes("vs prior")) return "comparison";
  if (label.includes("quote")) return "quote";
  if (label.includes("timeline")) return "timeline";
  if (label.includes("table") || label.includes("evidence")) return "table";
  if (label.includes("kpi") || label.includes("topline")) return "kpi_stat";
  if (label.includes("sparkline")) return "sparkline";
  if (label.includes("time series") || label.includes("trend")) return "time_series";
  if (label.includes("ranked") || label.includes("top categories")) return "ranked_bar";
  if (label.includes("callout")) return "callout";

  return "text_insight";
}
