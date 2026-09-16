import type { NextAuthConfig } from "next-auth";

if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET måste vara konfigurerad.");

/**
 * The half of the Auth.js config that carries no Prisma or bcrypt imports, so
 * `src/proxy.ts` can verify the session JWT without pulling the database
 * client into the proxy bundle — and, more importantly, without a DB roundtrip
 * on every single request. The proxy only does the optimistic cookie check
 * Next.js recommends; the authoritative account checks live in
 * `src/lib/current-user.ts` and `src/lib/admin.ts`, next to the data.
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
} satisfies NextAuthConfig;
