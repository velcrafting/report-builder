export type WidgetLayer = "metric" | "narrative" | "structural";

export type WidgetKind =
  | "kpi_stat"
  | "sparkline"
  | "time_series"
  | "ranked_bar"
  | "table"
  | "text_insight"
  | "callout"
  | "timeline"
  | "comparison"
  | "quote";

export type WidgetDensity = "compact" | "standard" | "expanded";
export type WidgetLayoutSize = "full" | "half" | "third" | "sidebar";
export type WidgetTone = "default" | "teal" | "amber" | "rose" | "sky";

export type WidgetRenderMode = "card" | "bar" | "quote";

export type WidgetConfig = {
  variant?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  comparisonMode?: "none" | "previous_period" | "target";
  annotations?: Array<{ date?: string; label: string }>;
  thresholds?: Array<{ value: number; label: string }>;
};

export type WidgetStateFlags = {
  loading?: boolean;
  empty?: boolean;
  partial?: boolean;
  error?: boolean;
  stale?: boolean;
  filtered?: boolean;
  expanded?: boolean;
};

export type WidgetContract = {
  id: string;
  type: WidgetKind;
  title?: string;
  subtitle?: string;
  description?: string;
  data: unknown;
  config: WidgetConfig;
  layout: {
    size: WidgetLayoutSize;
    minHeight?: number;
  };
  theme: {
    density?: WidgetDensity;
    tone?: WidgetTone;
  };
  states: WidgetStateFlags;
  bindings?: {
    dateRange?: string;
    filters?: string;
    sourceFields?: string[];
  };
  interactions?: {
    expandable?: boolean;
    downloadable?: boolean;
    crossFilter?: boolean;
  };
  visibilityRules?: Array<Record<string, unknown>>;
  exportOptions?: {
    pdfSafe?: boolean;
    csvExport?: boolean;
  };
};

export type WidgetDefinition = {
  kind: WidgetKind;
  label: string;
  layer: WidgetLayer;
  defaultRenderMode: WidgetRenderMode;
  supportedRenderModes: WidgetRenderMode[];
  defaultConfig?: WidgetConfig;
};
