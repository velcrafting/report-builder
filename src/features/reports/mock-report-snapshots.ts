import { REPORT_ZONES } from "@/config/reporting";
import { REPORTING_SECTIONS } from "@/config/sections";
import type { ReportSnapshot, RollupSnapshot } from "./types";

const storyBlocks = REPORT_ZONES.map((zone, index) => ({
  key: zone.key,
  title: zone.title,
  intro:
    index === 0
      ? "Start with the operating picture and the question leadership should keep in mind while reading the rest of the report."
      : zone.description,
  lead:
    index === 0
      ? "What mattered most from this reporting period"
      : index === 1
        ? "The baseline and commitments we entered the period with"
        : index === 2
          ? "The strongest signals that emerged once the data settled"
          : index === 3
            ? "The next actions that now deserve attention"
            : "The supporting proof that backs the narrative",
  cards: [
    {
      id: `${zone.key}-primary`,
      eyebrow: index === 0 ? "Topline" : "Key point",
      title: index === 0 ? "Reach expanded without losing narrative control" : "Structured report block",
      body:
        index === 0
          ? "The readout should feel like a memo with proof, not a dashboard with decoration. This opening block sets the stance immediately."
          : "This block stands in for the final widget composition that will combine mapped fields, annotations, and editorial framing.",
      metric: index === 0 ? "+12%" : undefined,
      supportingLabel: index === 0 ? "vs prior quarter" : undefined,
      widgetType: index === 0 ? ("comparison" as const) : ("text_insight" as const),
    },
    {
      id: `${zone.key}-secondary`,
      eyebrow: zone.title === "Supporting evidence" ? "Evidence" : "Context",
      title:
        zone.title === "Supporting evidence"
          ? "Proof point reserved for tables and linked evidence"
          : "Narrative support block",
      body:
        zone.title === "Supporting evidence"
          ? "The final readout should show hard numbers and details without collapsing back into generic dashboard clutter."
          : "Each report block should serve a clear narrative purpose rather than just fill a zone with cards.",
      widgetType:
        zone.title === "Supporting evidence" ? ("table" as const) : ("text_insight" as const),
    },
  ],
}));

export const reportSnapshots = Object.fromEntries(
  REPORTING_SECTIONS.map((section, index) => [
    section.value,
    {
      sectionLabel: section.label,
      reportTitle:
        index % 2 === 0
          ? `${section.label} quarterly executive readout`
          : `${section.label} monthly operating readout`,
      periodLabel: index % 2 === 0 ? "Quarterly · Q1 2026" : "Monthly · March 2026",
      summary:
        "This pass is aimed at the final artifact quality: better pacing, clearer hierarchy, and a more deliberate blend of metrics, interpretation, and next-step commitments.",
      framingQuestion:
        "Are we learning fast enough from this period to justify the next set of communications bets?",
      outputStateLabel: index % 2 === 0 ? "Approved" : "In Review",
      outputVersionLabel: `v${index + 2}`,
      topMetrics: [
        {
          label: "Primary reach",
          value: "1.42M",
          change: "+12% vs prior period",
          context: "Growth matters here because the signal stayed qualified rather than turning into a shallow attention spike.",
        },
        {
          label: "Qualified actions",
          value: "184",
          change: "+18 net new",
          context: "The period created more concrete downstream movement, not just surface engagement.",
        },
      ],
      storyBlocks,
      evidenceRows: [
        {
          label: "Imported rows preserved",
          value: "2,418",
          note: "Raw records stay intact so mapping changes do not require re-uploading source files.",
        },
        {
          label: "Candidate fields available",
          value: "17 columns",
          note: "New source columns remain candidates until an editor assigns a reporting role.",
        },
        {
          label: "Roll-up eligible widgets",
          value: "4 blocks",
          note: "Promotion to roll-up should be inferred, but editors still retain override control.",
        },
      ],
      callouts: [
        {
          tone: "highlight" as const,
          title: "What looks strong",
          body: "The story frame is visible immediately, and the top-line metrics support a coherent narrative instead of competing with it.",
        },
        {
          tone: "risk" as const,
          title: "What still needs pressure",
          body: "The editing workflow should clearly separate evidence blocks, narrative blocks, and raw candidate materials.",
        },
        {
          tone: "next" as const,
          title: "What comes next",
          body: "Use the builder surface to connect widget-editing decisions directly to the final readout shape.",
        },
      ],
    } satisfies ReportSnapshot,
  ]),
) as Record<string, ReportSnapshot>;

export const shareToken = "academy-q1-v3";

export function getRollupSnapshot(periodId: string): RollupSnapshot | null {
  if (periodId !== "2026-q1") {
    return null;
  }

  return {
    periodLabel: "Q1 2026",
    title: "Cross-section executive roll-up",
    summary:
      "The roll-up shell aggregates only approved section outputs. Later phases will infer candidate highlights and allow editorial overrides before final approval.",
    topLine: [
      { label: "Approved sections", value: "3/5", detail: "Academy, GEO, and Brand OS are approval-ready." },
      { label: "Open blockers", value: "2", detail: "Blog and Defensive Communications still need review resolution." },
      { label: "Shareable outputs", value: "4", detail: "Immutable snapshots have active read-only links." },
    ],
    highlights: [
      {
        sectionLabel: "Academy",
        title: "Story frame stayed intact through metric changes",
        body: "Editors used mapped candidate fields to refresh the narrative without changing the report layout.",
      },
      {
        sectionLabel: "GEO",
        title: "High-signal next step promoted into roll-up",
        body: "Roll-up inference later needs to consider priority, classification, and explicit include-in-rollup flags.",
      },
      {
        sectionLabel: "Brand OS",
        title: "Supporting evidence remains dense but skimmable",
        body: "Charts and evidence widgets should support the story rather than becoming a wall of metrics.",
      },
    ],
    sourceSections: REPORTING_SECTIONS.slice(0, 3).map((section) => ({
      sectionLabel: section.label,
      summary: `Approved ${section.label} output available for executive roll-up consumption.`,
    })),
  };
}
