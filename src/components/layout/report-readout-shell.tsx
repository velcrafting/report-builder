import Link from "next/link";
import type { ReactNode } from "react";

type ReportReadoutShellProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export function ReportReadoutShell({ eyebrow, title, children }: ReportReadoutShellProps) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1980px] px-5 py-6 lg:px-7 lg:py-8">
      <header className="mb-6 flex flex-col gap-4 rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.07),_rgba(255,255,255,0.02))] px-6 py-5 shadow-[0_18px_60px_rgba(3,6,18,0.28)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/45">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{title}</h1>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm text-slate-300">
          <Link
            href="/admin"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10"
          >
            Control room
          </Link>
          <Link
            href="/admin/reports"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10"
          >
            Edit builder
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
