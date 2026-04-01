import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

export default function AdminNotFound() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/40">404</p>
        <h1 className="text-2xl font-semibold text-white">Page not found</h1>
        <p className="text-sm text-slate-400">This admin page doesn&apos;t exist.</p>
        <Link
          href="/admin"
          className="mt-2 inline-flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
        >
          Back to dashboard
        </Link>
      </div>
    </AppShell>
  );
}
