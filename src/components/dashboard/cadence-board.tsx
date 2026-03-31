import Link from "next/link";
import { ArrowUpRight, Link2 } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { StatusPill } from "./status-pill";
import { CadenceChart } from "./cadence-chart";

type StatusCount = {
  key: "draft" | "in_review" | "approved" | "superseded" | "share_ready";
  label: string;
  count: number;
};

type CadenceEntry = {
  cadence: string;
  periodLabel: string;
  statusCounts: StatusCount[];
  sections: Array<{
    name: string;
    route: string;
    statusLabel: string;
    statusTone: StatusCount["key"];
    shareReady: boolean;
  }>;
};

type Snapshot = {
  metrics: Array<{ label: string; value: string; detail: string }>;
  chart: Array<{ label: string; approved: number; review: number; draft: number }>;
  cadenceGroups: CadenceEntry[];
};

type CadenceBoardProps = {
  snapshot: Snapshot;
};

export function CadenceBoard({ snapshot }: CadenceBoardProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SurfaceCard eyebrow="Operational status" title="Cadence coverage">
          <div className="grid gap-3 sm:grid-cols-3">
            {snapshot.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4"
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/40">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
                  {metric.value}
                </p>
                <p className="mt-2 text-sm text-slate-300">{metric.detail}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
        <SurfaceCard eyebrow="Readiness curve" title="Draft to approval distribution">
          <CadenceChart data={snapshot.chart} />
        </SurfaceCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {snapshot.cadenceGroups.map((group) => (
          <SurfaceCard
            key={group.cadence}
            eyebrow={group.periodLabel}
            title={group.cadence}
            contentClassName="space-y-5"
          >
            <div className="flex flex-wrap gap-2">
              {group.statusCounts.map((status) => (
                <div
                  key={status.key}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200"
                >
                  <span className="font-semibold">{status.label}</span>
                  <span className="ml-2 text-white/60">{status.count}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {group.sections.map((section) => (
                <Link
                  key={`${group.cadence}-${section.name}`}
                  href={section.route}
                  className="flex items-center justify-between rounded-[1.3rem] border border-white/10 bg-slate-950/45 px-4 py-3 transition hover:border-white/20 hover:bg-slate-950/70"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{section.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusPill label={section.statusLabel} tone={section.statusTone} />
                      {section.shareReady ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                          <Link2 className="h-3.5 w-3.5 text-[var(--accent)]" />
                          Read-only link generated
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-white/50" />
                </Link>
              ))}
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
