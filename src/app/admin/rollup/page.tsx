import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageIntro } from "@/components/layout/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireWhitelisted } from "@/features/auth/session";
import { listPeriods } from "@/lib/db/periods";
import { listOutputVersions } from "@/lib/db/outputs";
import { getSectionLabel } from "@/config/sections";
import { listRollupVersions } from "@/lib/db/rollups";
import { RollupComposer } from "@/components/rollup/rollup-composer";

type Props = {
  searchParams: Promise<{ periodId?: string }>;
};

const STATE_COLORS: Record<string, string> = {
  draft: "text-slate-400 border-white/10 bg-white/5",
  in_review: "text-amber-300 border-amber-400/30 bg-amber-400/10",
  approved: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  superseded: "text-slate-500 border-white/5 bg-white/3",
};

const STATE_LABELS: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  superseded: "Superseded",
};

export default async function AdminRollupPage({ searchParams }: Props) {
  await requireWhitelisted();

  const { periodId: qsPeriodId } = await searchParams;

  const periods = await listPeriods();
  const activePeriod = periods.find((p) => p.id === qsPeriodId) ?? periods[0];

  const [outputs, existingRollups] = activePeriod
    ? await Promise.all([
        listOutputVersions(activePeriod.id),
        listRollupVersions(activePeriod.id),
      ])
    : [[], []];

  // Only approved outputs can feed a roll-up
  const approvedOutputs = outputs.filter((o) => o.state === "approved");

  const availableOutputs = approvedOutputs.map((o) => ({
    id: o.id,
    section: o.section,
    sectionLabel: getSectionLabel(o.section),
    versionNumber: o.versionNumber,
    approvedAt: o.approvedAt,
  }));

  return (
    <AppShell>
      <PageIntro
        eyebrow="Roll-up"
        title="Compose roll-up report"
        description="Combine approved section outputs into a single executive roll-up. Only approved outputs appear here."
      />

      {/* Period selector */}
      {periods.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => {
            const isActive = p.id === activePeriod?.id;
            return (
              <Link
                key={p.id}
                href={`?periodId=${p.id}`}
                className={`rounded-[1.1rem] border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-[var(--accent)]/40 bg-[var(--accent)]/15 text-white"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
      )}

      {activePeriod ? (
        <>
          <SurfaceCard
            eyebrow="Composer"
            title={`New roll-up for ${activePeriod.label}`}
          >
            <RollupComposer
              periodId={activePeriod.id}
              periodLabel={activePeriod.label}
              availableOutputs={availableOutputs}
            />
          </SurfaceCard>

          <SurfaceCard eyebrow="History" title="Existing roll-up versions">
            {existingRollups.length === 0 ? (
              <p className="text-sm text-slate-400">
                No roll-up versions yet for {activePeriod.label}.
              </p>
            ) : (
              <div className="space-y-2">
                {existingRollups.map((rollup) => {
                  let sourceCount = 0;
                  try {
                    const ids = JSON.parse(rollup.sourceOutputIdsJson) as unknown[];
                    sourceCount = Array.isArray(ids) ? ids.length : 0;
                  } catch {
                    // ignore parse errors
                  }
                  return (
                    <div
                      key={rollup.id}
                      className="flex items-center justify-between gap-4 rounded-[1.15rem] border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">
                          {rollup.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {sourceCount} source output
                          {sourceCount !== 1 ? "s" : ""} &middot;{" "}
                          {new Date(rollup.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${STATE_COLORS[rollup.state] ?? STATE_COLORS.draft}`}
                      >
                        {STATE_LABELS[rollup.state] ?? rollup.state}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </SurfaceCard>
        </>
      ) : (
        <SurfaceCard eyebrow="Notice" title="No periods found">
          <p className="text-sm text-slate-400">
            Create a reporting period before composing a roll-up.
          </p>
        </SurfaceCard>
      )}
    </AppShell>
  );
}
