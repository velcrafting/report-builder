import { REPORT_ZONES } from "@/config/reporting";
import { createStoryCardFromWidgetKind } from "@/features/widgets";
import type { WidgetKind } from "@/features/widgets";
import type { ReportSnapshot } from "./types";

export type ReportCreationPreset = {
  id: string;
  label: string;
  description: string;
  blockPlan: Partial<Record<(typeof REPORT_ZONES)[number]["key"], WidgetKind[]>>;
};

export const reportCreationPresets: ReportCreationPreset[] = [
  {
    id: "executive-quarterly",
    label: "Executive Quarterly",
    description: "Topline summary, comparison framing, and evidence-heavy support blocks.",
    blockPlan: {
      "header-summary": ["kpi_stat", "comparison"],
      "where-we-started": ["text_insight", "timeline"],
      "what-we-learned": ["time_series", "ranked_bar", "callout"],
      "where-were-going-next": ["text_insight", "comparison"],
      "supporting-evidence": ["table", "quote"],
    },
  },
  {
    id: "investigation-readout",
    label: "Investigation Readout",
    description: "Timeline + evidence flow for incident and investigation narratives.",
    blockPlan: {
      "header-summary": ["callout", "text_insight"],
      "where-we-started": ["timeline"],
      "what-we-learned": ["time_series", "table"],
      "where-were-going-next": ["comparison", "text_insight"],
      "supporting-evidence": ["table", "quote"],
    },
  },
];

const reportPresetMap = new Map(reportCreationPresets.map((preset) => [preset.id, preset]));

function buildEmptyStoryBlocks(base: ReportSnapshot): ReportSnapshot["storyBlocks"] {
  return base.storyBlocks.map((block) => ({ ...block, cards: [] }));
}

export function createBlankReport(base: ReportSnapshot, reportTitle: string): ReportSnapshot {
  return {
    ...base,
    reportTitle,
    storyBlocks: buildEmptyStoryBlocks(base),
  };
}

export function createReportFromPreset(
  presetId: string,
  base: ReportSnapshot,
  reportTitle: string,
): ReportSnapshot {
  const preset = reportPresetMap.get(presetId);
  if (!preset) {
    return createBlankReport(base, reportTitle);
  }

  const storyBlocks = base.storyBlocks.map((block) => {
    const blockKey = block.key as (typeof REPORT_ZONES)[number]["key"];
    const widgetKinds = preset.blockPlan[blockKey] ?? [];
    const cards = widgetKinds.map((kind, index) =>
      createStoryCardFromWidgetKind(kind, {
        id: `${block.key}-${kind}-${index + 1}`,
      }),
    );

    return {
      ...block,
      cards,
    };
  });

  return {
    ...base,
    reportTitle,
    storyBlocks,
  };
}
