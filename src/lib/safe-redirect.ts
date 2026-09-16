/**
 * Accepts only same-site absolute paths ("/lag"), rejecting protocol-relative
 * ones ("//evil.example") and anything absolute, so a `callbackUrl` handed in
 * by a crafted link can't turn the login page into an open redirect.
 */
export function safeCallbackUrl(value: string | null | undefined) {
  return typeof value === "string" && /^\/(?!\/)/.test(value) ? value : "/";
}
