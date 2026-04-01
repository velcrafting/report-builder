"use client";
import { useEffect } from "react";
import Link from "next/link";

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function AdminError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="max-w-md space-y-4 rounded-[1.45rem] border border-white/10 bg-white/5 px-8 py-8 text-center">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/40">Error</p>
        <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
        <p className="text-sm text-slate-400">{error.message}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={reset}
            className="inline-flex h-9 items-center rounded-full border border-[var(--accent)]/45 bg-[var(--accent)]/12 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--accent)]/20"
          >
            Try again
          </button>
          <Link
            href="/admin"
            className="inline-flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
