import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { contentSecurityPolicy, requiresSession, SECURITY_HEADERS } from "@/lib/route-access";

const { auth } = NextAuth(authConfig);

const isDevelopment = process.env.NODE_ENV === "development";

/** next/link prefetches must not get a nonce — the payload would outlive it. */
function isPrefetch(request: NextRequest) {
  return (
    request.headers.get("next-router-prefetch") !== null ||
    request.headers.get("purpose") === "prefetch"
  );
}

function applySecurityHeaders(response: Response, csp: string | null) {
  if (csp) response.headers.set("Content-Security-Policy", csp);
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }
  return response;
}

export default auth((request) => {
  const { pathname, search } = request.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = isPrefetch(request) ? null : contentSecurityPolicy(nonce, { development: isDevelopment });

  // Optimistic check only: this reads the session cookie and never the
  // database, as Next.js recommends for proxy. Whether the account is still
  // active and approved is re-checked against the database on every page and
  // server action via src/lib/current-user.ts and src/lib/admin.ts.
  if (requiresSession(pathname) && !request.auth?.user) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/login";
    signInUrl.search = "";
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return applySecurityHeaders(NextResponse.redirect(signInUrl), csp);
  }

  const requestHeaders = new Headers(request.headers);
  // The root layout needs the path to know whether a blocked account should be
  // turned away before anything renders; server components can't read it.
  requestHeaders.set("x-pathname", pathname);
  if (csp) {
    // Next.js reads the nonce back off the request's CSP header while rendering.
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);
  }

  return applySecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }), csp);
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|rink-background.png|manifest\\.webmanifest$|sw\\.js$|pwa/).*)",
  ],
};
