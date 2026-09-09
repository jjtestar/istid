import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const DEMO_USER_ID = "user-johan";

export async function getCurrentUser() {
  const session = await auth();

  const user = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email } })
    : await prisma.user.findUnique({ where: { id: DEMO_USER_ID } });

  if (!user) {
    throw new Error("No user found. Did you run `npm run db:seed`?");
  }

  return user;
}
