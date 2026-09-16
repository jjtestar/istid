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
    authorized: async ({ auth: session }) => {
      if (!session?.user?.email) return false;
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { isActive: true, accessApproved: true },
      });
      return user?.isActive === true && user.accessApproved === true;
    },
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
