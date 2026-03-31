import { getSectionLabel, REPORTING_SECTIONS } from "@/config/sections";
import { builderSnapshot } from "./mock-builder-snapshot";
import { getRollupSnapshot, reportSnapshots, shareToken } from "./mock-report-snapshots";
import type { ImportWorkspaceSnapshot, OutputCatalogSnapshot } from "./types";

export { getRollupSnapshot };

export function getSectionReportSnapshot(sectionSlug: string, periodId: string) {
  void periodId;
  return reportSnapshots[sectionSlug] ?? null;
}

export function getReportBuilderSnapshot() {
  return builderSnapshot;
}

export function getSharedOutputSnapshot(token: string) {
  if (token !== shareToken) {
    return null;
  }

  return {
    bannerTitle: "Academy quarterly readout",
    bannerBody:
      "This share route renders a read-only approved snapshot. Editing controls stay out of view, and supersession will eventually point to the newer approved version when one exists.",
    report: reportSnapshots.academy,
  };
}

export function getOutputCatalog(): OutputCatalogSnapshot {
  return {
    rows: [
      {
        id: "academy-v3",
        label: "Academy Q1 2026",
        sectionLabel: "Academy",
        stateLabel: "Approved",
        tone: "approved",
        lastUpdated: "Mar 26, 2026",
        shareToken,
      },
      {
        id: "blog-v2",
        label: "Blog March 2026",
        sectionLabel: "Blog",
        stateLabel: "In Review",
        tone: "in_review",
        lastUpdated: "Mar 29, 2026",
      },
      {
        id: "geo-v4",
        label: "GEO Q1 2026",
        sectionLabel: "GEO",
        stateLabel: "Superseded",
        tone: "superseded",
        lastUpdated: "Mar 19, 2026",
        shareToken: "geo-q1-v4",
      },
    ],
  };
}

export function getImportWorkspaceSnapshot(): ImportWorkspaceSnapshot {
  return {
    suggestedMappings: [
      {
        source: "impressions",
        role: "metric",
        note: "Suggested from prior Academy import batches.",
      },
      {
        source: "executive_takeaway",
        role: "takeaway",
        note: "Maps cleanly into narrative widgets without becoming a KPI.",
      },
      {
        source: "risk_flag",
        role: "classification",
        note: "Can feed risk/blocker/action cards and roll-up promotion signals.",
      },
    ],
  };
}

export function getKnownPeriodLinks() {
  return REPORTING_SECTIONS.map((section) => ({
    sectionLabel: getSectionLabel(section.value),
    href: `/reports/${section.value}/2026-q1`,
  }));
}
