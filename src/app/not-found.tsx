import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-10">
      <div className="rounded-[2rem] border border-white/10 bg-[var(--panel)] px-8 py-10 text-center">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/45">
          Not found
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white">
          That reporting surface doesn&apos;t exist yet.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-300">
          The scaffold includes the major product routes, but only a few sample periods and share
          tokens are seeded during this first pass.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/admin"
            className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-[var(--accent-strong)]"
          >
            Back to admin
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
