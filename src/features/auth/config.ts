import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isWhitelisted } from "@/config/whitelist";
import { upsertUserByEmail } from "@/lib/db/users";

// Extend next-auth types to include our custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: "admin" | "approver" | "editor" | "viewer";
      isWhitelisted: boolean;
    };
  }
  interface JWT {
    role: "admin" | "approver" | "editor" | "viewer";
    isWhitelisted: boolean;
    dbUserId?: string;
  }
}

// Dev bypass: if NEXT_PUBLIC_DEV_AUTH_BYPASS=true, skip Google OAuth check
// This MUST NOT be used in production.
const DEV_BYPASS =
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true" &&
  process.env.NODE_ENV !== "production";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    // Dev-only credential provider — only active when DEV_BYPASS=true
    ...(DEV_BYPASS
      ? [
          // Import CredentialsProvider dynamically to tree-shake in prod
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require("next-auth/providers/credentials").default({
            name: "Dev Bypass",
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Dev Password", type: "password" },
            },
            async authorize(
              credentials:
                | { email?: string; password?: string }
                | undefined
            ) {
              if (!credentials) return null;
              // Dev bypass password is fixed in dev only
              if (credentials.password !== "devpassword") return null;
              return {
                id: "dev-user",
                email: credentials.email ?? "dev@example.com",
                name: "Dev User",
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user }) {
      // Allow sign-in even for non-whitelisted users; they just get viewer role
      return !!user.email;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const adminEmails = (process.env.AUTH_ADMIN_EMAILS ?? "")
          .split(",")
          .map((e) => e.trim().toLowerCase());
        const isAdmin = adminEmails.includes(user.email.toLowerCase());
        const whitelisted = isAdmin || isWhitelisted(user.email);
        const role = isAdmin ? "admin" : whitelisted ? "editor" : "viewer";

        // Upsert into the User table so FK constraints resolve correctly.
        // token.dbUserId carries the real DB CUID for all subsequent requests.
        try {
          const dbUser = await upsertUserByEmail({
            email: user.email,
            name: user.name ?? undefined,
            role,
            isWhitelisted: whitelisted,
          });
          token.dbUserId = dbUser.id;
        } catch {
          // Non-fatal — fall back to OAuth sub; FK-constrained writes will still
          // fail but auth itself remains unaffected.
        }

        token.isWhitelisted = whitelisted;
        token.role = role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        // Prefer the real DB User ID; fall back to OAuth sub if upsert failed.
        session.user.id = (token.dbUserId as string | undefined) ?? token.sub ?? "";
        session.user.role =
          (token.role as "admin" | "approver" | "editor" | "viewer") ??
          "viewer";
        session.user.isWhitelisted = (token.isWhitelisted as boolean) ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
