import Link from "next/link";
import { BarChart3, FileStack, Home, Link2, PanelsTopLeft, Shapes, Upload } from "lucide-react";

const navGroups = [
  {
    label: "Workspace",
    items: [
      { href: "/admin", label: "Control Room", icon: Home },
      { href: "/admin/imports", label: "Imports", icon: Upload },
      { href: "/admin/reports", label: "Reports", icon: PanelsTopLeft },
      { href: "/admin/outputs", label: "Outputs", icon: FileStack },
    ],
  },
  {
    label: "Readout",
    items: [
      { href: "/reports/academy/2026-q1", label: "Section Report", icon: Shapes },
      { href: "/rollup/2026-q1", label: "Roll-up", icon: BarChart3 },
      { href: "/share/output/academy-q1-v3", label: "Read-only Share", icon: Link2 },
    ],
  },
];

export function SidebarNav() {
  return (
    <aside className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-4 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
      <div className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/45">
          Ledger Reporting
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
          Internal reporting control room
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Import flexible data, shape narrative outputs, and freeze executive-ready versions.
        </p>
      </div>

      <nav className="mt-6 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/35">
              {group.label}
            </p>
            <div className="mt-2 space-y-1.5">
              {group.items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm font-medium text-slate-200 transition hover:border-white/10 hover:bg-white/5"
                >
                  <span className="rounded-xl border border-white/10 bg-white/5 p-2">
                    <Icon className="h-4 w-4 text-[var(--accent)]" />
                  </span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
