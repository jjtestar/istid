import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const DEMO_USER_ID = "user-johan";

export async function getCurrentUser() {
  const { user } = await getCurrentUserWithTeam();
  return user;
}

export async function getCurrentUserWithTeam() {
  const session = await auth();
  const where = session?.user?.email ? { email: session.user.email } : { id: DEMO_USER_ID };

  const user = await prisma.user.findUnique({
    where,
    include: { teams: { include: { team: true } } },
  });

  if (!user) {
    throw new Error("No user found. Did you run `npm run db:seed`?");
  }

  const { teams, ...userFields } = user;
  const membership = teams[0] ?? null;
  return { user: userFields, team: membership?.team ?? null, membership };
}
