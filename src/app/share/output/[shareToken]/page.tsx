import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { ReportReadoutShell } from "@/components/layout/report-readout-shell";
import { ExecutiveReadout } from "@/components/reports/executive-readout";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getSharedOutputSnapshot } from "@/features/reports/mock-reports";
import { getShareLinkByToken } from "@/lib/db/shareLinks";
import { prisma } from "@/lib/db/prisma";

type ShareOutputPageProps = {
  params: Promise<{ shareToken: string }>;
};

export default async function ShareOutputPage({ params }: ShareOutputPageProps) {
  const { shareToken } = await params;

  // ── Try real DB share link first ────────────────────────────────────────────
  const shareLink = await getShareLinkByToken(shareToken);
  if (shareLink) {
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      notFound();
    }
    const outputVersion = await prisma.outputVersion.findUnique({
      where: { id: shareLink.outputVersionId },
    });
    if (!outputVersion) notFound();
    const snapshot = JSON.parse(outputVersion.snapshotJson) as unknown;
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="mb-8 rounded-[1.45rem] border border-white/10 bg-white/5 px-6 py-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/40">
              Shared Report
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              {outputVersion.section} — v{outputVersion.versionNumber}
            </h1>
            {outputVersion.approvedAt && (
              <p className="mt-1 text-sm text-slate-400">
                Approved {new Date(outputVersion.approvedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="rounded-[1.45rem] border border-white/10 bg-white/5 px-6 py-5">
            <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300">
              {JSON.stringify(snapshot, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // ── Fall back to mock snapshot (used by demo/seed data) ─────────────────────
  const mockSnapshot = getSharedOutputSnapshot(shareToken);
  if (!mockSnapshot) {
    notFound();
  }

  return (
    <ReportReadoutShell eyebrow="Read-only share" title={mockSnapshot.bannerTitle}>
      <div className="space-y-6">
        <SurfaceCard
          title={mockSnapshot.bannerTitle}
          actions={
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-white/55">
              <Lock className="h-3.5 w-3.5 text-[var(--accent)]" />
              Approved snapshot
            </span>
          }
        >
          <p className="text-sm leading-6 text-slate-300">{mockSnapshot.bannerBody}</p>
        </SurfaceCard>
        <ExecutiveReadout snapshot={mockSnapshot.report} />
      </div>
    </ReportReadoutShell>
  );
}
