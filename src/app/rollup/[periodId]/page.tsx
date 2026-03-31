import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageIntro } from "@/components/layout/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getRollupSnapshot } from "@/features/reports/mock-reports";

type RollupPageProps = {
  params: Promise<{ periodId: string }>;
};

export default async function RollupPage({ params }: RollupPageProps) {
  const { periodId } = await params;
  const snapshot = getRollupSnapshot(periodId);

  if (!snapshot) {
    notFound();
  }

  return (
    <AppShell>
      <PageIntro
        eyebrow={snapshot.periodLabel}
        title="Executive roll-up"
        description="Roll-ups are built from approved section outputs only. The first pass shows the intended story shape and promoted highlights while leaving full inference and override workflows for later phases."
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard eyebrow="Executive summary" title={snapshot.title}>
          <div className="space-y-4">
            <p className="text-base leading-7 text-slate-300">{snapshot.summary}</p>
            <div className="grid gap-3 md:grid-cols-3">
              {snapshot.topLine.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-4"
                >
                  <p className="text-[0.68rem] uppercase tracking-[0.2em] text-white/40">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard eyebrow="Promoted items" title="Highlights and next steps">
          <div className="space-y-3">
            {snapshot.highlights.map((highlight) => (
              <div
                key={highlight.title}
                className="rounded-[1.3rem] border border-white/10 bg-slate-950/45 px-4 py-4"
              >
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--accent)]">
                  {highlight.sectionLabel}
                </p>
                <h3 className="mt-3 text-base font-semibold text-white">{highlight.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{highlight.body}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard eyebrow="Source outputs" title="Approved sections feeding this roll-up">
        <div className="grid gap-3 lg:grid-cols-3">
          {snapshot.sourceSections.map((section) => (
            <div
              key={section.sectionLabel}
              className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-4"
            >
              <h3 className="text-base font-semibold text-white">{section.sectionLabel}</h3>
              <p className="mt-2 text-sm text-slate-300">{section.summary}</p>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </AppShell>
  );
}
