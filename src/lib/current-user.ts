import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const DEFAULT_TEAM_SLUG = "kumla";
export const DEFAULT_SEASON = "2026/27";

export function teamSlug(name: string) {
  return name
    .toLocaleLowerCase("sv-SE")
    .replace(/\s+hockeylag$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getCurrentUser() {
  const { user } = await getCurrentUserWithTeam();
  return user;
}

export async function getCurrentUserWithTeam() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const cookieStore = await cookies();

  const [user, availableTeams] = await Promise.all([
    prisma.user.findUnique({
      where: { email: session.user.email },
      include: { teams: true },
    }),
    prisma.team.findMany({ orderBy: [{ season: "desc" }, { name: "asc" }] }),
  ]);

  if (!user) {
    throw new Error("Den inloggade användaren finns inte i Femtekedjan.");
  }

  const selectedSlug = cookieStore.get("istid-team")?.value ?? DEFAULT_TEAM_SLUG;
  const selectedSeason = cookieStore.get("istid-season")?.value ?? DEFAULT_SEASON;
  const team =
    availableTeams.find(
      (candidate) => teamSlug(candidate.name) === selectedSlug && candidate.season === selectedSeason,
    ) ??
    availableTeams.find(
      (candidate) => teamSlug(candidate.name) === DEFAULT_TEAM_SLUG && candidate.season === DEFAULT_SEASON,
    ) ??
    availableTeams[0] ??
    null;

  const { teams, ...userFields } = user;
  const membership = team ? teams.find((candidate) => candidate.teamId === team.id) ?? null : null;
  const teamNames = Array.from(new Set(availableTeams.map((candidate) => candidate.name))).sort((a, b) =>
    a.localeCompare(b, "sv-SE"),
  );
  const seasons = Array.from(new Set(availableTeams.map((candidate) => candidate.season))).sort((a, b) =>
    b.localeCompare(a, "sv-SE"),
  );

  return {
    user: userFields,
    team,
    membership,
    context: {
      selectedTeamSlug: team ? teamSlug(team.name) : DEFAULT_TEAM_SLUG,
      selectedSeason: team?.season ?? DEFAULT_SEASON,
      teams: teamNames.map((name) => ({ name, slug: teamSlug(name) })),
      seasons,
    },
  };
}
