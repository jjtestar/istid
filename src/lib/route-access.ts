/**
 * The route policy src/proxy.ts applies, kept in its own module so it can be
 * unit tested — proxy.ts itself may only export the proxy function and its
 * config.
 */

/** Pages that must render without a session. */
export const PUBLIC_PATHS = ["/login", "/registrera", "/aterstall", "/integritet"];

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Whether an unauthenticated request to this path should be bounced to the
 * login page. Route handlers under /api answer with a status code of their own
 * instead, so a fetch() gets 401/403 rather than a redirect to an HTML page.
 */
export function requiresSession(pathname: string) {
  return !isPublicPath(pathname) && !pathname.startsWith("/api/");
}

/** Paths only an administrator may open. */
export function requiresAdmin(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function contentSecurityPolicy(nonce: string, { development = false } = {}) {
  return [
    "default-src 'self'",
    // 'strict-dynamic' makes browsers ignore host allowlists and trust only
    // nonced scripts plus what they load — Next.js stamps the nonce onto its
    // own framework and page bundles automatically.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    // The theme swatches on /mer/teman are plain style attributes, which are
    // governed by style-src-attr rather than style-src.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob:",
    // next/font/google self-hosts its files at build time, so no external origin.
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};
