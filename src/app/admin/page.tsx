import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageIntro } from "@/components/layout/page-intro";
import { CadenceBoard } from "@/components/dashboard/cadence-board";
import { getAdminDashboardSnapshot } from "@/features/dashboard/mock-dashboard";

export default function AdminPage() {
  const snapshot = getAdminDashboardSnapshot();

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
