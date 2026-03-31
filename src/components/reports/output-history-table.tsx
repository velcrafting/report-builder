import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { StatusPill } from "@/components/dashboard/status-pill";

type OutputRow = {
  id: string;
  label: string;
  sectionLabel: string;
  stateLabel: string;
  tone: "draft" | "in_review" | "approved" | "superseded" | "share_ready";
  lastUpdated: string;
  shareToken?: string;
};

type OutputHistoryTableProps = {
  rows: OutputRow[];
};

export function OutputHistoryTable({ rows }: OutputHistoryTableProps) {
  return (
    <SurfaceCard eyebrow="Versioning" title="Output catalog">
      <div className="overflow-hidden rounded-[1.4rem] border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left">
          <thead className="bg-white/5 text-[0.72rem] uppercase tracking-[0.18em] text-white/50">
            <tr>
              <th className="px-4 py-3 font-medium">Output</th>
              <th className="px-4 py-3 font-medium">Section</th>
              <th className="px-4 py-3 font-medium">State</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-950/55">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-4 text-white">
                  <div className="font-semibold">{row.label}</div>
                </td>
                <td className="px-4 py-4 text-slate-300">{row.sectionLabel}</td>
                <td className="px-4 py-4">
                  <StatusPill label={row.stateLabel} tone={row.tone} />
                </td>
                <td className="px-4 py-4 text-slate-300">{row.lastUpdated}</td>
                <td className="px-4 py-4">
                  {row.shareToken ? (
                    <Link
                      href={`/share/output/${row.shareToken}`}
                      className="inline-flex items-center gap-1 text-sm text-white transition hover:text-[var(--accent)]"
                    >
                      Open
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="text-sm text-white/40">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}
