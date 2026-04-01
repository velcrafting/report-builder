import Link from "next/link";
import { requireRole } from "@/features/auth/session";
import { listPeriods } from "@/lib/db/periods";
import { listUsers } from "@/lib/db/users";
import { REPORTING_SECTIONS } from "@/config/sections";
import { AppShell } from "@/components/layout/app-shell";
import { PageIntro } from "@/components/layout/page-intro";
import { FieldRegistryTable } from "@/components/admin/field-registry-table";
import { PeriodManager } from "@/components/admin/period-manager";
import { UserTable } from "@/components/admin/user-table";

type SearchParams = Promise<{ tab?: string }>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("admin");
  const { tab = "registry" } = await searchParams;

  const [periods, users] = await Promise.all([listPeriods(), listUsers()]);

  const sectionValues = REPORTING_SECTIONS.map((s) => s.value);

  const tabs = [
    { key: "registry", label: "Field Registry" },
    { key: "periods", label: "Periods" },
    { key: "users", label: "Users" },
  ] as const;

  return (
    <AppShell>
      <PageIntro
        eyebrow="Admin · Settings"
        title="Settings"
        description="Manage field registry entries, reporting periods, and user access."
      />

      {/* Tab Navigation */}
      <nav className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 w-fit">
        {tabs.map(({ key, label }) => (
          <Link
            key={key}
            href={`/admin/settings?tab=${key}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? "bg-[var(--accent)] text-slate-950"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Tab Panels */}
      <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.07),_rgba(255,255,255,0.02))] px-6 py-6 shadow-[0_18px_60px_rgba(3,6,18,0.28)]">
        {tab === "registry" && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">Field Registry</h2>
            <FieldRegistryTable
              sections={sectionValues}
              initialSection={sectionValues[0]}
            />
          </section>
        )}

        {tab === "periods" && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">Periods</h2>
            <PeriodManager initialPeriods={periods} />
          </section>
        )}

        {tab === "users" && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">Users</h2>
            <UserTable
              initialUsers={users}
              currentUserId={session.user.id}
            />
          </section>
        )}
      </div>
    </AppShell>
  );
}
