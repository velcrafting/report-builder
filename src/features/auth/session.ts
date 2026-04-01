import { getServerSession as nextAuthGetServerSession } from "next-auth/next";
import { authOptions } from "./config";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/permissions";

export type AppSession = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: AppRole;
    isWhitelisted: boolean;
  };
};

/** Get the current session. Returns null if not authenticated. */
export async function getAppSession(): Promise<AppSession | null> {
  const session = await nextAuthGetServerSession(authOptions);
  if (!session?.user?.email) return null;
  return session as AppSession;
}

/** Require authentication. Redirects to /login if not authenticated. */
export async function requireSession(): Promise<AppSession> {
  const session = await getAppSession();
  if (!session) redirect("/login");
  return session;
}

/** Require a minimum role. Redirects to /login if unauthenticated, returns 403-ish redirect if insufficient role. */
export async function requireRole(minRole: AppRole): Promise<AppSession> {
  const session = await requireSession();
  const ROLE_RANK: Record<AppRole, number> = {
    admin: 4,
    approver: 3,
    editor: 2,
    viewer: 1,
  };
  if (ROLE_RANK[session.user.role] < ROLE_RANK[minRole]) {
    redirect("/login?error=insufficient_permissions");
  }
  return session;
}

/** Require the user to be whitelisted. */
export async function requireWhitelisted(): Promise<AppSession> {
  const session = await requireSession();
  if (!session.user.isWhitelisted) {
    redirect("/login?error=not_whitelisted");
  }
  return session;
}
