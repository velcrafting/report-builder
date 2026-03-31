import { AppShell } from "@/components/layout/app-shell";
import { PageIntro } from "@/components/layout/page-intro";
import { OutputHistoryTable } from "@/components/reports/output-history-table";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getOutputCatalog } from "@/features/reports/mock-reports";

export default function AdminOutputsPage() {
  const snapshot = getOutputCatalog();

  return (
    <AppShell>
      <PageIntro
        eyebrow="Outputs"
        title="Review versions, approvals, and read-only distribution"
        description="Approved outputs stay frozen, superseded outputs remain readable, and share links attach to immutable versions rather than mutable drafts."
      />
      <OutputHistoryTable rows={snapshot.rows} />
      <SurfaceCard eyebrow="Approval model" title="Immutable snapshot rules">
        <div className="grid gap-3 lg:grid-cols-3">
          {[
            "Only approver or admin users should be able to freeze an output.",
            "Editing after approval produces a new version rather than mutating the old snapshot.",
            "Read-only links should resolve to approved artifacts and fail cleanly when inactive or expired.",
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
