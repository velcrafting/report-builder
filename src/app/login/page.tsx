import Link from "next/link";
import { LockKeyhole, Mail, Shield } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10 lg:px-10">
      <section className="grid w-full gap-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,_rgba(12,18,29,0.95),_rgba(8,12,20,0.98))] p-8 shadow-[0_30px_120px_rgba(5,8,14,0.48)] lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-5">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/45">
            Authentication
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white">
            Sign in to edit internal reporting outputs.
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-300">
            Production access is designed around Google OAuth plus whitelist-driven roles. The
            scaffold also documents a development-only local password bypass controlled by env.
          </p>
          <div className="grid gap-3">
            {[
              { icon: Mail, label: "Google OAuth in production" },
              { icon: Shield, label: "Whitelist-based roles for viewer, editor, approver, admin" },
              { icon: LockKeyhole, label: "Development-only local bypass gated by env config" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
              >
                <Icon className="h-4 w-4 text-[var(--accent)]" />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-medium text-slate-300">First-pass auth shell</p>
          <div className="mt-6 space-y-4">
            <button className="flex w-full items-center justify-center rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[var(--accent-strong)]">
              Continue with Google
            </button>
            <div className="rounded-[1.2rem] border border-white/10 bg-slate-950/55 px-4 py-4 text-sm text-slate-300">
              Wire Auth.js providers and role resolution in phase two. This route exists now so the
              product shell is coherent and bootable.
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Continue to scaffold
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
