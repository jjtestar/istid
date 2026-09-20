import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const DEFAULT_TEAM_SLUG = "kumla";
/** Välkomstformuläret som varje nytt konto passerar innan appen öppnas. */
export const ONBOARDING_PATH = "/valkommen";
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

/**
 * Identity only, in a single query. For pages and actions that pick their teams
 * from the database rather than from the cookie-selected context, this skips
 * the `teams` include and the available-teams lookup `getCurrentUserWithTeam`
 * needs — three statements the Anmälan and Kalender renders were paying for
 * fields they never read.
 */
export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      role: true,
      isSuperAdmin: true,
      isActive: true,
      accessApproved: true,
      onboardedAt: true,
    },
  });

  // Reachable with a still-valid session cookie once access is revoked, so it
  // has to be a redirect rather than an error page. /login recognises the stale
  // session and offers to sign out.
  if (!user || !user.isActive || !user.accessApproved) redirect("/login");
  // Nya konton fyller i välkomstformuläret innan de släpps in i appen.
  if (!user.onboardedAt) redirect(ONBOARDING_PATH);

  return user;
}

export async function getCurrentUserWithTeam() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const cookieStore = await cookies();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { teams: true },
  });

  if (!user || !user.isActive || !user.accessApproved) redirect("/login");
  if (!user.onboardedAt) redirect(ONBOARDING_PATH);

  const availableTeams =
    user.role === "ADMIN" || user.isSuperAdmin
      ? await prisma.team.findMany({ where: { archivedAt: null }, orderBy: [{ season: "desc" }, { name: "asc" }] })
      : await prisma.team.findMany({
          where: { archivedAt: null, members: { some: { userId: user.id } } },
          orderBy: [{ season: "desc" }, { name: "asc" }],
        });

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

/**
 * Every team a user is a member of for a given season (all teams for admins),
 * driven entirely by the database — used for the multi-team aggregated views
 * (Anmälan, Kalender) rather than the single cookie-selected team.
 */
export async function getUserSeasonTeams(userId: string, isAdmin: boolean, season: string) {
  return prisma.team.findMany({
    where: {
      season,
      archivedAt: null,
      ...(isAdmin ? {} : { members: { some: { userId } } }),
    },
    orderBy: { name: "asc" },
  });
}

/** Every season the user has ever belonged to a team in (all seasons for admins). Archived teams are excluded from the current season but still browsable historically. */
export async function getUserSeasons(userId: string, isAdmin: boolean) {
  const teams = await prisma.team.findMany({
    where: isAdmin ? {} : { members: { some: { userId } } },
    select: { season: true },
    distinct: ["season"],
  });
  return Array.from(new Set(teams.map((candidate) => candidate.season))).sort((a, b) =>
    b.localeCompare(a, "sv-SE"),
  );
}
