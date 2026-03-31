import { AppShell } from "@/components/layout/app-shell";
import { PageIntro } from "@/components/layout/page-intro";
import { ReportBuilderWorkspace } from "@/components/reports/report-builder-workspace";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getReportBuilderSnapshot } from "@/features/reports/mock-reports";

export default function AdminReportsPage() {
  const snapshot = getReportBuilderSnapshot();

  return (
    <AppShell>
      <PageIntro
        eyebrow="Builder"
        title="Compose the report the way the final readout will actually be consumed"
        description="This pass makes editability explicit: the left rail shows building blocks, the center canvas shows fixed report zones, and the right inspector explains how a selected widget shapes the final executive artifact."
      />
      <ReportBuilderWorkspace snapshot={snapshot} />
      <SurfaceCard eyebrow="Builder foundations" title="What this builder should evolve into next">
        <div className="grid gap-3 lg:grid-cols-3">
          {[
            "Persist widget edits and drag/reorder actions so the canvas becomes a real editing surface.",
            "Attach source-field previews and annotation streams directly to each widget card.",
            "Save roll-up inclusion decisions and approval-safe narrative notes on each output version.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-300"
            >
              {item}
            </div>
          ))}
        </div>
      </SurfaceCard>
    </AppShell>
  );
}
