import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { ReportReadoutShell } from "@/components/layout/report-readout-shell";
import { ExecutiveReadout } from "@/components/reports/executive-readout";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getSharedOutputSnapshot } from "@/features/reports/mock-reports";

type ShareOutputPageProps = {
  params: Promise<{ shareToken: string }>;
};

export default async function ShareOutputPage({ params }: ShareOutputPageProps) {
  const { shareToken } = await params;
  const snapshot = getSharedOutputSnapshot(shareToken);

  if (!snapshot) {
    notFound();
  }

  return (
    <ReportReadoutShell eyebrow="Read-only share" title={snapshot.bannerTitle}>
      <div className="space-y-6">
        <SurfaceCard
          title={snapshot.bannerTitle}
          actions={
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-white/55">
              <Lock className="h-3.5 w-3.5 text-[var(--accent)]" />
              Approved snapshot
            </span>
          }
        >
          <p className="text-sm leading-6 text-slate-300">{snapshot.bannerBody}</p>
        </SurfaceCard>
        <ExecutiveReadout snapshot={snapshot.report} />
      </div>
    </ReportReadoutShell>
  );
}
