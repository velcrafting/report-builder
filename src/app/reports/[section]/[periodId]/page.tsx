import { notFound } from "next/navigation";
import { ReportReadoutShell } from "@/components/layout/report-readout-shell";
import { ExecutiveReadout } from "@/components/reports/executive-readout";
import { getSectionReportSnapshot } from "@/features/reports/mock-reports";

type ReportPageProps = {
  params: Promise<{ section: string; periodId: string }>;
};

export default async function SectionReportPage({ params }: ReportPageProps) {
  const { section, periodId } = await params;
  const snapshot = getSectionReportSnapshot(section, periodId);

  if (!snapshot) {
    notFound();
  }

  return (
    <ReportReadoutShell eyebrow="Section readout" title={`${snapshot.sectionLabel} executive readout`}>
      <ExecutiveReadout snapshot={snapshot} />
    </ReportReadoutShell>
  );
}
