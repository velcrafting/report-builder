import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageIntro } from "@/components/layout/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { NewReportForm } from "@/components/reports/new-report-form";
import { requireWhitelisted } from "@/features/auth/session";
import { listPeriods } from "@/lib/db/periods";
import { getSectionLabel } from "@/config/sections";
import { listReportDrafts } from "@/features/reports/actions";
import type { PeriodSummary } from "@/lib/db";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  superseded: "Superseded",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "text-slate-400 border-white/10 bg-white/5",
  in_review: "text-amber-300 border-amber-400/30 bg-amber-400/10",
  approved: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  superseded: "text-slate-500 border-white/5 bg-white/3",
};

export default async function AdminReportsPage() {
  await requireWhitelisted();

  const periods = await listPeriods();

  // Load drafts for each period and combine
  const allDraftsByPeriod = await Promise.all(
    periods.map((period) => listReportDrafts({ periodId: period.id }))
  );
  const allDrafts = allDraftsByPeriod.flat();

  // Build a period label lookup
  const periodLabelById: Record<string, string> = {};
  for (const period of periods) {
    periodLabelById[period.id] = period.label;
  }

  return (
    <AppShell>
      <PageIntro
        eyebrow="Reports"
        title="Report drafts"
        description="Create and manage section report drafts. Each draft maps to a period and section, and can contain widget instances that feed the final executive artifact."
      />

      <SurfaceCard eyebrow="New report" title="Start a new draft">
        <NewReportForm periods={periods as PeriodSummary[]} />
      </SurfaceCard>

      <SurfaceCard eyebrow="All drafts" title="Existing report drafts">
        {allDrafts.length === 0 ? (
          <p className="text-sm text-slate-400">
            No report drafts yet. Create one above to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {allDrafts.map((draft) => (
              <Link
                key={draft.id}
                href={`/admin/reports/${draft.id}`}
                className="flex items-center justify-between gap-4 rounded-[1.15rem] border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{draft.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {getSectionLabel(draft.section)} &middot; {periodLabelById[draft.periodId] ?? draft.periodId}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${STATUS_COLORS[draft.status] ?? STATUS_COLORS.draft}`}
                >
                  {STATUS_LABELS[draft.status] ?? draft.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </SurfaceCard>
    </AppShell>
  );
}
