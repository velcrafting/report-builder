import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageIntro } from "@/components/layout/page-intro";
import { ReportBuilderWorkspace } from "@/components/reports/report-builder-workspace";
import { requireWhitelisted } from "@/features/auth/session";
import { getReportDraftWithWidgets } from "@/features/reports/actions";
import { getSectionLabel } from "@/config/sections";

type Props = {
  params: Promise<{ draftId: string }>;
};

export default async function ReportDraftPage({ params }: Props) {
  const { draftId } = await params;

  await requireWhitelisted();

  const draft = await getReportDraftWithWidgets(draftId);

  if (!draft) {
    notFound();
  }

  const sectionLabel = getSectionLabel(draft.section);

  return (
    <AppShell>
      <PageIntro
        eyebrow={sectionLabel}
        title={draft.title}
        description="Build and configure the widgets for this report draft. Changes are persisted to the database as you work."
      />
      <ReportBuilderWorkspace
        initialDraft={draft}
        initialWidgets={draft.widgets}
      />
    </AppShell>
  );
}
