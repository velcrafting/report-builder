import { reportSnapshots } from "./mock-report-snapshots";
import type { ReportBuilderSnapshot } from "./types";

export const builderSnapshot: ReportBuilderSnapshot = {
  draftTitle: "Academy Q1 2026 draft",
  sectionLabel: "Academy",
  periodLabel: "Quarterly · Q1 2026",
  selectedTemplateId: "academy-quarterly",
  selectedWidgetId: "learned-performance-arc",
  templates: [
    {
      id: "academy-quarterly",
      label: "Academy quarterly",
      sectionValue: "academy",
      cadence: "Quarterly",
      description: "Narrative-heavy template with KPI strip, learning arc, and next-step commitments.",
      previewReport: reportSnapshots.academy,
    },
    {
      id: "blog-monthly",
      label: "Blog monthly",
      sectionValue: "blog",
      cadence: "Monthly",
      description: "Faster cadence template with campaign comparisons, editorial calls, and evidence table.",
      previewReport: reportSnapshots.blog,
    },
    {
      id: "geo-quarterly",
      label: "GEO quarterly",
      sectionValue: "geo",
      cadence: "Quarterly",
      description: "Executive summary with market themes, annotated charting, and decision log widgets.",
      previewReport: reportSnapshots.geo,
    },
  ],
  dataFeeds: [
    {
      id: "feed-academy-primary",
      label: "Academy Q1 primary upload",
      kind: "upload",
      status: "connected",
      detail: "2,418 rows mapped from the latest quarterly CSV import.",
    },
    {
      id: "feed-academy-supplemental",
      label: "Evidence workbook",
      kind: "upload",
      status: "connected",
      detail: "Supporting detail feed bound to evidence and milestone widgets.",
    },
    {
      id: "feed-youtube-api",
      label: "YouTube analytics API",
      kind: "api",
      status: "candidate",
      detail: "Planned integration for auto-suggested charts and summary strips.",
    },
  ],
  workflowNotes: [
    "Primary Academy CSV is mapped and ready for narrative composition.",
    "Two annotations are still unresolved before approval handoff.",
    "Roll-up candidates are visible inline so editors can shape the eventual exec summary.",
  ],
  libraryGroups: [
    {
      title: "Mapped metrics",
      items: [
        {
          id: "metric-reach",
          label: "Reach growth KPI",
          meta: "Source: impressions, engagement_rate",
          widgetType: "summary-strip",
        },
        {
          id: "metric-actions",
          label: "Qualified actions",
          meta: "Source: downstream_actions, conversion_notes",
          widgetType: "comparison-band",
        },
      ],
    },
    {
      title: "Narrative fields",
      items: [
        {
          id: "narrative-takeaway",
          label: "Executive takeaway",
          meta: "Source: executive_takeaway",
          widgetType: "narrative-insight",
        },
        {
          id: "narrative-learnings",
          label: "Learned theme cluster",
          meta: "Source: summary_notes, audience_notes",
          widgetType: "quote-block",
        },
      ],
    },
    {
      title: "Evidence and flags",
      items: [
        {
          id: "evidence-table",
          label: "Evidence table",
          meta: "Source: source_url, campaign_name, result",
          widgetType: "table-widget",
        },
        {
          id: "flag-risk",
          label: "Risk / blocker annotation",
          meta: "Source: risk_flag, blocker_notes",
          widgetType: "risk-blocker-action",
        },
      ],
    },
    {
      title: "Rich widgets",
      items: [
        {
          id: "graph-trendline",
          label: "Graph widget",
          meta: "Source: monthly_reach, conversion_rate, checkpoint_date",
          widgetType: "graph-widget",
        },
        {
          id: "timeline-release",
          label: "Milestone timeline",
          meta: "Source: launch_dates, campaign_calendar",
          widgetType: "milestone-timeline",
        },
        {
          id: "decision-log",
          label: "Decision log",
          meta: "Source: strategy_notes, approval_comments",
          widgetType: "decision-log",
        },
      ],
    },
  ],
  zones: [
    {
      key: "header-summary",
      title: "Header summary",
      purpose: "Frame the period in one glance: what moved, why it matters, and what the executive question is.",
      cards: [
        {
          id: "header-kpi-strip",
          widgetType: "KPI card strip",
          title: "Quarter in one line",
          source: "Reach growth KPI + qualified actions",
          size: "Large",
          includeInRollup: true,
          status: "ready",
        },
      ],
    },
    {
      key: "what-we-learned",
      title: "What we learned",
      purpose: "Show the strongest signal from the period and the evidence that justifies it.",
      cards: [
        {
          id: "learned-performance-arc",
          widgetType: "Narrative insight",
          title: "Performance arc and why it happened",
          source: "Executive takeaway + evidence table + annotation cluster",
          value: "Reach +42% with stable conversion quality after week 5 adjustments.",
          size: "Large",
          includeInRollup: true,
          status: "ready",
        },
        {
          id: "learned-proof",
          widgetType: "Annotated chart",
          title: "Proof points and exceptions",
          source: "Evidence rows + candidate support fields",
          value: "Strongest gain in channel partnerships; weakest in new format pilots.",
          size: "Medium",
          includeInRollup: false,
          status: "ready",
        },
        {
          id: "learned-trend-graph",
          widgetType: "Graph widget",
          title: "Weekly trend line",
          source: "monthly_reach + conversion_rate",
          value: "Week 6 inflection confirms narrative shift in audience behavior.",
          size: "Medium",
          includeInRollup: true,
          status: "ready",
        },
      ],
    },
    {
      key: "where-we-started",
      title: "Where we started",
      purpose: "Anchor the report in baseline assumptions and the commitments made at the start of the period.",
      cards: [
        {
          id: "baseline-comparison",
          widgetType: "Comparison band",
          title: "Baseline posture versus current posture",
          source: "Baseline metrics + period-over-period comparison",
          size: "Medium",
          includeInRollup: false,
          status: "ready",
        },
      ],
    },
    {
      key: "where-were-going-next",
      title: "Where we’re going next",
      purpose: "Convert the period into concrete next actions, not just observations.",
      cards: [
        {
          id: "next-actions",
          widgetType: "Decision log",
          title: "Next-quarter commitments",
          source: "Action annotations + owner notes",
          size: "Medium",
          includeInRollup: true,
          status: "draft-only",
        },
        {
          id: "next-timeline",
          widgetType: "Milestone timeline",
          title: "Launch and checkpoint sequence",
          source: "Campaign calendar + owner deadlines",
          size: "Medium",
          includeInRollup: true,
          status: "needs-mapping",
        },
      ],
    },
  ],
  inspector: {
    widgetTitle: "Performance arc and why it happened",
    widgetType: "Narrative insight",
    narrativeGoal:
      "Explain what changed, what drove the change, and whether the change should alter the next planning cycle.",
    supportingFields: ["executive_takeaway", "campaign_name", "risk_flag", "qualified_actions"],
    controls: [
      { label: "Zone", value: "What we learned" },
      { label: "Size", value: "Large" },
      { label: "Roll-up eligibility", value: "Included" },
      { label: "Evidence density", value: "Moderate" },
    ],
  },
};
