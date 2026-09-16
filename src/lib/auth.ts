import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { normalizeEmail } from "@/lib/invite-security";
import { prisma } from "@/lib/prisma";

/**
 * A real bcrypt hash (cost 12) of a value nobody can supply. Comparing against
 * it keeps the "no such account" path exactly as expensive as the "wrong
 * password" path, so login response times can't be used to enumerate which
 * e-mail addresses have accounts.
 */
const ABSENT_ACCOUNT_HASH = "$2b$12$0Uw6Fcoe4gUL8OYa21OVSeE.jfHcBxsc0OoF4PJvx4YwBY6Euc1Oi";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
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
          where: { email: normalizeEmail(email) },
        });

        const valid = await bcrypt.compare(password, user?.passwordHash ?? ABSENT_ACCOUNT_HASH);
        if (!valid || !user?.passwordHash || !user.isActive || !user.accessApproved) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
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
