import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isWhitelisted } from "@/config/whitelist";

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
        const whitelisted = isWhitelisted(user.email);
        token.isWhitelisted = whitelisted;
        // Default role: whitelisted users get editor, others get viewer
        // Admins must be manually promoted via DB or env
        const adminEmails = (process.env.AUTH_ADMIN_EMAILS ?? "")
          .split(",")
          .map((e) => e.trim().toLowerCase());
        if (adminEmails.includes(user.email.toLowerCase())) {
          token.role = "admin";
        } else if (whitelisted) {
          token.role = "editor";
        } else {
          token.role = "viewer";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub ?? "";
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
