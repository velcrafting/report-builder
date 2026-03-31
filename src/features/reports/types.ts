import type { WidgetConfig, WidgetKind } from "@/features/widgets/types";

export type ToneKey = "draft" | "in_review" | "approved" | "superseded" | "share_ready";

export type ReportSnapshot = {
  sectionLabel: string;
  reportTitle: string;
  periodLabel: string;
  summary: string;
  framingQuestion: string;
  outputStateLabel: string;
  outputVersionLabel: string;
  topMetrics: Array<{
    label: string;
    value: string;
    change: string;
    context: string;
  }>;
  storyBlocks: Array<{
    key: string;
    title: string;
    intro: string;
    lead: string;
    cards: Array<{
      id: string;
      eyebrow: string;
      title: string;
      body: string;
      metric?: string;
      supportingLabel?: string;
      widgetType?: WidgetKind;
      widgetConfig?: WidgetConfig;
      widgetData?: Record<string, unknown>;
    }>;
  }>;
  evidenceRows: Array<{
    label: string;
    value: string;
    note: string;
  }>;
  callouts: Array<{
    tone: "highlight" | "risk" | "next";
    title: string;
    body: string;
  }>;
};

export type ReportBuilderSnapshot = {
  draftTitle: string;
  sectionLabel: string;
  periodLabel: string;
  selectedTemplateId: string;
  selectedWidgetId: string;
  templates: Array<{
    id: string;
    label: string;
    sectionValue: string;
    cadence: string;
    description: string;
    previewReport: ReportSnapshot;
  }>;
  dataFeeds: Array<{
    id: string;
    label: string;
    kind: "upload" | "api";
    status: "connected" | "candidate" | "needs-attention";
    detail: string;
  }>;
  workflowNotes: string[];
  libraryGroups: Array<{
    title: string;
    items: Array<{
      id: string;
      label: string;
      meta: string;
      widgetType: string;
    }>;
  }>;
  zones: Array<{
    key: string;
    title: string;
    purpose: string;
    cards: Array<{
      id: string;
      widgetType: string;
      title: string;
      source: string;
      value?: string;
      size: string;
      includeInRollup: boolean;
      status: "ready" | "needs-mapping" | "draft-only";
    }>;
  }>;
  inspector: {
    widgetTitle: string;
    widgetType: string;
    narrativeGoal: string;
    supportingFields: string[];
    controls: Array<{
      label: string;
      value: string;
    }>;
  };
};

export type RollupSnapshot = {
  periodLabel: string;
  title: string;
  summary: string;
  topLine: Array<{ label: string; value: string; detail: string }>;
  highlights: Array<{ sectionLabel: string; title: string; body: string }>;
  sourceSections: Array<{ sectionLabel: string; summary: string }>;
};

export type OutputCatalogSnapshot = {
  rows: Array<{
    id: string;
    label: string;
    sectionLabel: string;
    stateLabel: string;
    tone: ToneKey;
    lastUpdated: string;
    shareToken?: string;
  }>;
};

export type ImportWorkspaceSnapshot = {
  suggestedMappings: Array<{ source: string; role: string; note: string }>;
};
