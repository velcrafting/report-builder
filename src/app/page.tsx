import Link from "next/link";
import { ArrowRight, BarChart3, Files, ShieldCheck, Sparkles } from "lucide-react";

const highlights = [
  {
    title: "Reporting builder, not a dashboard",
    body: "The scaffold centers the editorial workflow: import, map, compose, approve, and publish.",
    icon: Files,
  },
  {
    title: "Immutable executive outputs",
    body: "Approved versions are treated as frozen readouts that remain readable after supersession.",
    icon: ShieldCheck,
  },
  {
    title: "Roll-up ready foundation",
    body: "Core routes and report zones are structured so later roll-up inference does not require a rewrite.",
    icon: BarChart3,
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10 lg:px-10">
      <section className="grid gap-8 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,122,45,0.18),_transparent_32%),linear-gradient(180deg,_rgba(17,23,35,0.96),_rgba(7,11,19,0.98))] p-8 shadow-[0_30px_120px_rgba(5,8,14,0.48)] lg:grid-cols-[1.3fr_0.7fr] lg:p-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/70">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            Ledger Reporting
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              Executive-ready reporting built around narrative clarity.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              This first pass turns the docs-only repo into a bootable Next.js scaffold for imports,
              report composition, approvals, outputs, and shareable readouts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[var(--accent-strong)]"
            >
              Open control room
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/reports/academy/2026-q1"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View sample readout
            </Link>
          </div>
        </div>

        <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
              Product frame
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
              Where we started. What we learned. Where we&apos;re going next.
            </h2>
          </div>
          <div className="grid gap-3">
            {[
              "Upload one primary CSV per section and period",
              "Treat new columns as candidate fields, not automatic KPIs",
              "Build section outputs inside fixed report zones",
              "Freeze approvals into immutable snapshots for sharing and roll-up",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        {highlights.map(({ title, body, icon: Icon }) => (
          <article
            key={title}
            className="rounded-[1.5rem] border border-[var(--border-strong)] bg-[var(--panel)] p-6"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <Icon className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
