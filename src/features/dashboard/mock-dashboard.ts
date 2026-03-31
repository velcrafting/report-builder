import type { ToneKey } from "@/features/reports/types";

export function getAdminDashboardSnapshot() {
  return {
    metrics: [
      {
        label: "Active periods",
        value: "3",
        detail: "Weekly, monthly, and quarterly cadences currently have in-flight reporting.",
      },
      {
        label: "Approved outputs",
        value: "6",
        detail: "Frozen snapshots are ready for readout or roll-up inclusion.",
      },
      {
        label: "Share links",
        value: "4",
        detail: "Approved read-only outputs currently have generated access links.",
      },
    ],
    chart: [
      { label: "Weekly", approved: 2, review: 1, draft: 2 },
      { label: "Monthly", approved: 1, review: 2, draft: 2 },
      { label: "Quarterly", approved: 3, review: 1, draft: 1 },
    ],
    cadenceGroups: [
      {
        cadence: "Weekly",
        periodLabel: "Week of Mar 25, 2026",
        statusCounts: [
          { key: "draft" as ToneKey, label: "Draft", count: 2 },
          { key: "in_review" as ToneKey, label: "In Review", count: 1 },
          { key: "approved" as ToneKey, label: "Approved", count: 1 },
          { key: "superseded" as ToneKey, label: "Superseded", count: 0 },
          { key: "share_ready" as ToneKey, label: "Read-Only Link Generated", count: 1 },
        ],
        sections: [
          {
            name: "Academy",
            route: "/reports/academy/2026-q1",
            statusLabel: "Approved",
            statusTone: "approved" as ToneKey,
            shareReady: true,
          },
          {
            name: "Blog",
            route: "/admin/reports",
            statusLabel: "Draft",
            statusTone: "draft" as ToneKey,
            shareReady: false,
          },
        ],
      },
      {
        cadence: "Monthly",
        periodLabel: "March 2026",
        statusCounts: [
          { key: "draft" as ToneKey, label: "Draft", count: 1 },
          { key: "in_review" as ToneKey, label: "In Review", count: 2 },
          { key: "approved" as ToneKey, label: "Approved", count: 1 },
          { key: "superseded" as ToneKey, label: "Superseded", count: 1 },
          { key: "share_ready" as ToneKey, label: "Read-Only Link Generated", count: 1 },
        ],
        sections: [
          {
            name: "Defensive Communications",
            route: "/admin/imports",
            statusLabel: "In Review",
            statusTone: "in_review" as ToneKey,
            shareReady: false,
          },
          {
            name: "Blog",
            route: "/admin/outputs",
            statusLabel: "Superseded",
            statusTone: "superseded" as ToneKey,
            shareReady: true,
          },
        ],
      },
      {
        cadence: "Quarterly",
        periodLabel: "Q1 2026",
        statusCounts: [
          { key: "draft" as ToneKey, label: "Draft", count: 1 },
          { key: "in_review" as ToneKey, label: "In Review", count: 1 },
          { key: "approved" as ToneKey, label: "Approved", count: 3 },
          { key: "superseded" as ToneKey, label: "Superseded", count: 1 },
          { key: "share_ready" as ToneKey, label: "Read-Only Link Generated", count: 2 },
        ],
        sections: [
          {
            name: "GEO",
            route: "/reports/geo/2026-q1",
            statusLabel: "Approved",
            statusTone: "approved" as ToneKey,
            shareReady: true,
          },
          {
            name: "Brand OS",
            route: "/reports/brand-os/2026-q1",
            statusLabel: "Approved",
            statusTone: "approved" as ToneKey,
            shareReady: false,
          },
          {
            name: "Academy",
            route: "/reports/academy/2026-q1",
            statusLabel: "In Review",
            statusTone: "in_review" as ToneKey,
            shareReady: false,
          },
        ],
      },
    ],
  };
}
