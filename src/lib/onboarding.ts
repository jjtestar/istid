import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DEFAULT_SEASON } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export type TakenJersey = { number: number; name: string };

/**
 * Tröjnummer som redan är upptagna i laget, med spelaren som bär numret.
 * `exceptUserId` lämnar spelarens eget nummer ledigt, så att en ändring av den
 * egna profilen inte krockar med sig själv.
 */
export async function getTakenJerseyNumbers(
  teamId: string,
  exceptUserId?: string,
): Promise<TakenJersey[]> {
  const members = await prisma.teamMember.findMany({
    where: {
      teamId,
      jerseyNo: { not: null },
      ...(exceptUserId ? { NOT: { userId: exceptUserId } } : {}),
    },
    select: { jerseyNo: true, user: { select: { name: true } } },
    orderBy: { jerseyNo: "asc" },
  });

  return members.map((member) => ({
    number: member.jerseyNo as number,
    name: member.user.name ?? "Lagkamrat",
  }));
}

/**
 * Identiteten bakom välkomstformuläret. Går medvetet inte via
 * `getCurrentUserWithTeam`: de hjälparna skickar vidare hit när formuläret inte
 * är ifyllt, och sidan skulle annars loopa mot sig själv.
 */
export async function getOnboardingContext() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      emergencyContact: true,
      heightCm: true,
      weightKg: true,
      stickSide: true,
      isActive: true,
      accessApproved: true,
      onboardedAt: true,
      teams: {
        select: {
          id: true,
          jerseyNo: true,
          preferredPosition: true,
          playingThisSeason: true,
          participatesInMatches: true,
          trainingDays: true,
          team: { select: { id: true, name: true, season: true, archivedAt: true } },
        },
      },
    },
  });

  if (!user || !user.isActive || !user.accessApproved) redirect("/login");
  if (user.onboardedAt) redirect("/");

  // Inbjudan knyter spelaren till ett lag, men ett konto kan ha flera
  // medlemskap. Aktuell säsong vinner, annars första icke-arkiverade laget.
  const memberships = user.teams.filter((membership) => !membership.team.archivedAt);
  const membership =
    memberships.find((candidate) => candidate.team.season === DEFAULT_SEASON) ??
    memberships[0] ??
    null;

  const takenJerseys = membership
    ? await getTakenJerseyNumbers(membership.team.id, user.id)
    : [];

  return { user, membership, takenJerseys };
}
