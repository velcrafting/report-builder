"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { LockKeyhole, Mail, Shield } from "lucide-react";

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

function LoginForm() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [devEmail, setDevEmail] = useState("dev@example.com");
  const [devPassword, setDevPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.push("/admin");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05080e]">
        <div className="text-white/40 text-sm">Loading…</div>
      </div>
    );
  }

  const errorMessage =
    error === "not_whitelisted"
      ? "Your account is not authorized to access this app."
      : error === "insufficient_permissions"
      ? "You do not have sufficient permissions."
      : error
      ? "Sign-in failed. Please try again."
      : null;

  async function handleDevSignIn(e: React.FormEvent) {
    e.preventDefault();
    setIsSigningIn(true);
    await signIn("credentials", {
      email: devEmail,
      password: devPassword,
      callbackUrl: "/admin",
    });
    setIsSigningIn(false);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10 lg:px-10">
      <section className="grid w-full gap-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,_rgba(12,18,29,0.95),_rgba(8,12,20,0.98))] p-8 shadow-[0_30px_120px_rgba(5,8,14,0.48)] lg:grid-cols-[1fr_0.9fr]">
        {/* Left: description */}
        <div className="space-y-5">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/45">
            Authentication
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white">
            Sign in to edit internal reporting outputs.
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-300">
            Production access uses Google OAuth with whitelist-driven roles.
            {DEV_BYPASS && (
              <span className="ml-1 text-amber-400">
                Dev bypass is active — credential sign-in is enabled.
              </span>
            )}
          </p>
          <div className="grid gap-3">
            {[
              { icon: Mail, label: "Google OAuth in production" },
              {
                icon: Shield,
                label: "Whitelist-based roles: viewer, editor, approver, admin",
              },
              {
                icon: LockKeyhole,
                label: "Development-only local bypass gated by env config",
              },
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

        {/* Right: sign-in panel */}
        <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-6 space-y-4">
          <p className="text-sm font-medium text-slate-300">
            Sign in to continue
          </p>

          {errorMessage && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-4 py-3">
              {errorMessage}
            </div>
          )}

          <button
            onClick={() => signIn("google", { callbackUrl: "/admin" })}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[var(--accent-strong)]"
          >
            <Mail className="h-4 w-4" />
            Continue with Google
          </button>

          {DEV_BYPASS && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-white/30">dev bypass</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <form onSubmit={handleDevSignIn} className="space-y-3">
                <input
                  type="email"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="dev@example.com"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/55 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
                <input
                  type="password"
                  value={devPassword}
                  onChange={(e) => setDevPassword(e.target.value)}
                  placeholder="Dev password"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/55 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  {isSigningIn ? "Signing in…" : "Sign in (dev)"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#05080e]">
          <div className="text-white/40 text-sm">Loading…</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
