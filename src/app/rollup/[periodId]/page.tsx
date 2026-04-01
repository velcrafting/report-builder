import { AppShell } from "@/components/layout/app-shell";
import { PageIntro } from "@/components/layout/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireWhitelisted } from "@/features/auth/session";
import { getApprovedRollup, getRollupVersion } from "@/lib/db/rollups";

type RollupPageProps = {
  params: Promise<{ periodId: string }>;
};

type SnapshotSection = {
  sectionLabel: string;
  versionNumber: number;
  summary: string | null;
};

type RollupSnapshot = {
  periodId: string;
  createdAt: string;
  sections: SnapshotSection[];
};

export default async function RollupPage({ params }: RollupPageProps) {
  await requireWhitelisted();

  const { periodId } = await params;

  // getApprovedRollup returns a summary without snapshotJson; fetch the full row
  const summary = await getApprovedRollup(periodId);
  const rollup = summary ? await getRollupVersion(summary.id) : null;

  if (!rollup) {
    return (
      <AppShell>
        <PageIntro
          eyebrow="Roll-up"
          title="No approved roll-up"
          description="There is no approved roll-up for this period yet. Ask an admin to compose and approve one."
        />
        <SurfaceCard eyebrow="Status" title="Nothing here yet">
          <p className="text-sm text-slate-400">
            Once an admin composes and approves a roll-up for this period, it
            will appear here.
          </p>
        </SurfaceCard>
      </AppShell>
    );
  }

  let snapshot: RollupSnapshot | null = null;
  try {
    snapshot = JSON.parse(rollup.snapshotJson) as RollupSnapshot;
  } catch {
    // leave null — show raw fallback
  }

  return (
    <AppShell>
      <PageIntro
        eyebrow="Roll-up"
        title={rollup.title}
        description="This executive roll-up is composed from approved section outputs."
      />

      {snapshot && snapshot.sections && snapshot.sections.length > 0 ? (
        <SurfaceCard eyebrow="Source sections" title="Sections in this roll-up">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {snapshot.sections.map((section, idx) => (
              <div
                key={idx}
                className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-4"
              >
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--accent)]">
                  {section.sectionLabel}
                </p>
                <p className="mt-2 text-sm font-semibold text-white/60">
                  Version {section.versionNumber}
                </p>
                {section.summary ? (
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {section.summary}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-500 italic">
                    No summary available.
                  </p>
                )}
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : (
        <SurfaceCard eyebrow="Sections" title="Roll-up contents">
          <p className="text-sm text-slate-400">
            This roll-up does not contain any section data.
          </p>
        </SurfaceCard>
      )}

      <SurfaceCard eyebrow="Metadata" title="Roll-up details">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3">
            <dt className="text-[0.68rem] uppercase tracking-[0.2em] text-white/40">
              State
            </dt>
            <dd className="mt-1 text-sm font-semibold capitalize text-emerald-300">
              {rollup.state}
            </dd>
          </div>
          <div className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3">
            <dt className="text-[0.68rem] uppercase tracking-[0.2em] text-white/40">
              Created
            </dt>
            <dd className="mt-1 text-sm text-slate-300">
              {new Date(rollup.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </dd>
          </div>
          {snapshot?.sections && (
            <div className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3">
              <dt className="text-[0.68rem] uppercase tracking-[0.2em] text-white/40">
                Sections
              </dt>
              <dd className="mt-1 text-sm text-slate-300">
                {snapshot.sections.length}
              </dd>
            </div>
          )}
        </dl>
      </SurfaceCard>
    </AppShell>
  );
}
