import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: ["/admin/:path*", "/reports/:path*", "/rollup/:path*"],
};

export default async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { pathname } = request.nextUrl;

  // Admin routes: require whitelisted session
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!token.isWhitelisted) {
      return NextResponse.redirect(
        new URL("/login?error=not_whitelisted", request.url),
      );
    }
    return NextResponse.next();
  }

  // Reports and rollup: require any authenticated session
  if (pathname.startsWith("/reports") || pathname.startsWith("/rollup")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}
