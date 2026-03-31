export const OUTPUT_STATES = [
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "superseded", label: "Superseded" },
] as const;

export const REPORT_ZONES = [
  {
    key: "header-summary",
    title: "Header summary",
    description: "Top-line context that frames the reporting period, notable movement, and overall confidence.",
  },
  {
    key: "where-we-started",
    title: "Where we started",
    description: "Baseline conditions, prior commitments, and the initial posture for the period.",
  },
  {
    key: "what-we-learned",
    title: "What we learned",
    description: "Performance changes, signal shifts, and notable patterns worth executive attention.",
  },
  {
    key: "where-were-going-next",
    title: "Where we’re going next",
    description: "Actions, bets, blockers, and focus areas for the next reporting cycle.",
  },
  {
    key: "supporting-evidence",
    title: "Supporting evidence",
    description: "Charts, tables, and evidentiary widgets that support the narrative without overwhelming it.",
  },
] as const;

export const CLASSIFICATION_OPTIONS = [
  { value: "highlight", label: "Highlight" },
  { value: "risk", label: "Risk" },
  { value: "blocker", label: "Blocker" },
  { value: "action", label: "Action" },
  { value: "none", label: "None" },
] as const;

export const ROLE_OPTIONS = [
  { value: "viewer", label: "Viewer" },
  { value: "editor", label: "Editor" },
  { value: "approver", label: "Approver" },
  { value: "admin", label: "Admin" },
] as const;
