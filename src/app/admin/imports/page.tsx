import { AppShell } from "@/components/layout/app-shell";
import { PageIntro } from "@/components/layout/page-intro";
import { ImportWorkspace } from "@/components/imports/import-workspace";
import { SurfaceCard } from "@/components/ui/surface-card";
import { CADENCE_OPTIONS, SECTION_OPTIONS } from "@/config/sections";
import { getImportWorkspaceSnapshot } from "@/features/reports/mock-reports";

export default function AdminImportsPage() {
  const snapshot = getImportWorkspaceSnapshot();

  return (
    <AppShell>
      <PageIntro
        eyebrow="Imports"
        title="Capture raw uploads without collapsing field flexibility"
        description="Editors assign period metadata at upload time, inspect detected columns, and keep unmapped fields available as future candidates."
      />
      <ImportWorkspace
        sections={SECTION_OPTIONS}
        cadences={CADENCE_OPTIONS}
        suggestedMappings={snapshot.suggestedMappings}
      />
      <SurfaceCard eyebrow="Workflow rule" title="Import principles">
        <ul className="grid gap-3 text-sm leading-6 text-slate-300 lg:grid-cols-3">
          <li className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4">
            Store raw rows exactly as uploaded for auditability and future remapping.
          </li>
          <li className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4">
            Reuse section-aware mappings where safe, but never let unmapped columns block success.
          </li>
          <li className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4">
            Keep candidate fields visible until an editor decides they belong in a KPI, chart, or note.
          </li>
        </ul>
      </SurfaceCard>
    </AppShell>
  );
}
