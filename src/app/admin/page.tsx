import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageIntro } from "@/components/layout/page-intro";
import { CadenceBoard } from "@/components/dashboard/cadence-board";
import { prisma } from "@/lib/db/prisma";
import { REPORTING_SECTIONS } from "@/config/sections";
import type { DashboardSnapshot } from "@/components/dashboard/cadence-board";

// Derive the most prominent state for a section in a period.
// Priority: approved > in_review > draft > superseded
const STATE_PRIORITY = ["approved", "in_review", "draft", "superseded"] as const;
type OutputState = (typeof STATE_PRIORITY)[number];

function dominantState(states: string[]): OutputState {
  for (const s of STATE_PRIORITY) {
    if (states.includes(s)) return s;
  }
  return "draft";
}

const STATE_LABELS: Record<OutputState, string> = {
  approved: "Approved",
  in_review: "In Review",
  draft: "Draft",
  superseded: "Superseded",
};

export default async function AdminPage() {
  // Fetch all periods ordered by start date descending
  const periods = await prisma.period.findMany({
    orderBy: { startDate: "desc" },
  });

  // Fetch all output versions and share links in two queries
  const [allOutputs, allShareLinks] = await Promise.all([
    prisma.outputVersion.findMany({
      select: { section: true, state: true, periodId: true },
    }),
    prisma.shareLink.findMany({
      where: { active: true },
      select: {
        outputVersion: { select: { section: true, periodId: true } },
      },
    }),
  ]);

  // Build cadenceGroups from periods
  const cadenceGroups = periods.map((period) => {
    const periodOutputs = allOutputs.filter((o) => o.periodId === period.id);
    const periodShareLinks = allShareLinks.filter(
      (l) => l.outputVersion.periodId === period.id,
    );

    const draftCount = periodOutputs.filter((o) => o.state === "draft").length;
    const inReviewCount = periodOutputs.filter((o) => o.state === "in_review").length;
    const approvedCount = periodOutputs.filter((o) => o.state === "approved").length;
    const supersededCount = periodOutputs.filter((o) => o.state === "superseded").length;
    const shareReadyCount = periodShareLinks.length;

    const sections = REPORTING_SECTIONS.map(({ value, label }) => {
      const sectionOutputs = periodOutputs.filter((o) => o.section === value);
      const sectionStates = sectionOutputs.map((o) => o.state);
      const dominant = dominantState(sectionStates);
      const hasShareLink = periodShareLinks.some(
        (l) => l.outputVersion.section === value,
      );

      return {
        name: label,
        route:
          sectionStates.includes("approved")
            ? `/reports/${value}/${period.id}`
            : "/admin/outputs",
        statusLabel: sectionStates.length === 0 ? "No output" : STATE_LABELS[dominant],
        statusTone: (sectionStates.length === 0 ? "draft" : dominant) as
          | "draft"
          | "in_review"
          | "approved"
          | "superseded"
          | "share_ready",
        shareReady: hasShareLink,
      };
    });

    return {
      cadence:
        period.cadence.charAt(0).toUpperCase() + period.cadence.slice(1),
      periodLabel: period.label,
      statusCounts: [
        { key: "draft" as const, label: "Draft", count: draftCount },
        { key: "in_review" as const, label: "In Review", count: inReviewCount },
        { key: "approved" as const, label: "Approved", count: approvedCount },
        { key: "superseded" as const, label: "Superseded", count: supersededCount },
        {
          key: "share_ready" as const,
          label: "Read-Only Link Generated",
          count: shareReadyCount,
        },
      ],
      sections,
    };
  });

  // Compute top-level metrics
  const activePeriodCount = periods.length;
  const totalApproved = allOutputs.filter((o) => o.state === "approved").length;
  const totalShareLinks = allShareLinks.length;

  // Build chart data grouped by cadence
  const cadenceValues = ["weekly", "monthly", "quarterly", "custom"] as const;
  const chart = cadenceValues
    .filter((c) => periods.some((p) => p.cadence === c))
    .map((c) => {
      const cadenceOutputs = allOutputs.filter((o) =>
        periods.filter((p) => p.cadence === c).some((p) => p.id === o.periodId),
      );
      return {
        label: c.charAt(0).toUpperCase() + c.slice(1),
        approved: cadenceOutputs.filter((o) => o.state === "approved").length,
        review: cadenceOutputs.filter((o) => o.state === "in_review").length,
        draft: cadenceOutputs.filter((o) => o.state === "draft").length,
      };
    });

  const snapshot: DashboardSnapshot = {
    metrics: [
      {
        label: "Active periods",
        value: String(activePeriodCount),
        detail: `${activePeriodCount} reporting period${activePeriodCount !== 1 ? "s" : ""} tracked across all cadences.`,
      },
      {
        label: "Approved outputs",
        value: String(totalApproved),
        detail: "Frozen snapshots ready for readout or roll-up inclusion.",
      },
      {
        label: "Share links",
        value: String(totalShareLinks),
        detail: "Approved read-only outputs with active access links.",
      },
    ],
    chart,
    cadenceGroups,
  };

  return (
    <AppShell>
      <PageIntro
        eyebrow="Admin birds-eye board"
        title="Control room for imports, outputs, and executive readiness"
        description="Track every section by cadence, see which outputs are still draft or in review, and move quickly into imports, report building, or read-only sharing."
        actions={
          <>
            <Link
              href="/admin/imports"
              className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-[var(--accent-strong)]"
            >
              Start import
            </Link>
            <Link
              href="/admin/reports"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Open builder
            </Link>
          </>
        }
      />
      <CadenceBoard snapshot={snapshot} />
    </AppShell>
  );
}
