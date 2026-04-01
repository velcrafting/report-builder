import { AppShell } from "@/components/layout/app-shell";
import { PageIntro } from "@/components/layout/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireWhitelisted } from "@/features/auth/session";
import { listAuditEvents } from "@/lib/db/auditLog";

function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export default async function AdminAuditPage() {
  await requireWhitelisted();
  const events = await listAuditEvents({ limit: 200 });

  return (
    <AppShell>
      <PageIntro
        eyebrow="Admin — audit trail"
        title="Audit log"
        description="A read-only record of key state-change events: draft status changes, output approvals, and share link creation."
      />

      <SurfaceCard
        eyebrow={`${events.length} event${events.length !== 1 ? "s" : ""}`}
        title="Recent events"
        className="mt-6"
      >
        {events.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No audit events yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="pb-3 pr-4 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/40">
                    Timestamp
                  </th>
                  <th className="pb-3 pr-4 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/40">
                    Action
                  </th>
                  <th className="pb-3 pr-4 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/40">
                    Entity
                  </th>
                  <th className="pb-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/40">
                    Actor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {events.map((event) => (
                  <tr key={event.id} className="group hover:bg-white/[0.03]">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {formatTimestamp(event.createdAt)}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-block rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-xs text-slate-200">
                        {event.action}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-slate-300">{event.entityType}</span>
                      <span className="ml-2 font-mono text-xs text-slate-500">
                        {truncate(event.entityId, 16)}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-xs text-slate-400">
                      {event.actorId ? truncate(event.actorId, 20) : (
                        <span className="italic text-slate-500">system</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SurfaceCard>
    </AppShell>
  );
}
