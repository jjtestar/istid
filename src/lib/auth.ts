import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET måste vara konfigurerad.");

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-post", type: "email" },
        password: { label: "Lösenord", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.trim().toLocaleLowerCase("sv-SE") },
        });
        if (!user?.passwordHash || !user.isActive || !user.accessApproved) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    /**
     * Runs in the proxy on every matched request — page loads, RSC fetches and
     * every Server Action POST alike — so it stays a pure token check. Looking
     * the account up here cost a database roundtrip before the request even
     * reached the route, and every entry point behind it re-reads the user
     * anyway: getSessionUser, getCurrentUserWithTeam and requireAdmin all
     * reject a deactivated or unapproved account, as do setTheme, the RSVP
     * actions and /api/my-data. Revocation therefore still takes effect on the
     * very next request; it is simply enforced where the user is already read.
     */
    authorized: async ({ auth: session }) => Boolean(session?.user?.email),
    jwt: async ({ token, user }) => {
      if (user) token.role = (user as { role?: string }).role;
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) session.user.role = token.role as string;
      return session;
    },
  },
});
