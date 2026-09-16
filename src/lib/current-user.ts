import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPublicPath, requiresAdmin } from "@/lib/route-access";

export const DEFAULT_TEAM_SLUG = "kumla";
export const DEFAULT_SEASON = "2026/27";

/** Where a session that no longer maps to a usable account gets sent. */
export const BLOCKED_ACCOUNT_REDIRECT = "/login?orsak=sparrad";

export function teamSlug(name: string) {
  return name
    .toLocaleLowerCase("sv-SE")
    .replace(/\s+hockeylag$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * The authoritative account check. src/proxy.ts only verifies that a session
 * cookie exists; this re-reads the account from the database so a user who was
 * blocked or removed after their token was issued stops here, even though the
 * JWT itself is still valid. Memoised per render pass, so the many callers in a
 * single page share one token decode and one query.
 */
const findSessionAccount = cache(async () => {
  const session = await auth();
  if (!session?.user?.email) return { hasSession: false, user: null };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { teams: true },
  });

  const usable = user && user.isActive && user.accessApproved;
  return { hasSession: true, user: usable ? user : null };
});

/**
 * The signed-in account, or null when there is no session or it is no longer
 * usable. Returns rather than redirects, for callers that owe an HTTP status
 * code instead (see /api/my-data).
 */
export async function findActiveSessionUser() {
  return (await findSessionAccount()).user;
}

/** As above, but sends the browser somewhere sensible instead of returning null. */
export async function requireActiveUser() {
  const { hasSession, user } = await findSessionAccount();
  if (!hasSession) redirect("/login");

  // A valid session whose account is gone or blocked: bounce to the login page
  // with an explanation rather than throwing a 500 on every page they open.
  if (!user) redirect(BLOCKED_ACCOUNT_REDIRECT);

  return user;
}

/**
 * Called from the root layout so an unwelcome request is turned away *before*
 * any markup streams. The root loading.tsx puts a Suspense boundary around every
 * page, so a redirect raised inside a page happens after the shell has been
 * flushed; Next.js can then only fall back to a meta refresh, and the user sits
 * looking at the app chrome for a second before moving. Redirecting from the
 * layout, above that boundary, produces a real 307 instead.
 *
 * This does not replace requireActiveUser/requireAdmin in the pages themselves —
 * those stay authoritative, also cover server actions, and are what still
 * applies if the proxy never ran and x-pathname is therefore absent.
 */
export async function enforceRouteAccess() {
  const pathname = (await headers()).get("x-pathname");
  if (!pathname || isPublicPath(pathname)) return;

  const { hasSession, user } = await findSessionAccount();
  // No session at all is the proxy's business, not ours.
  if (!hasSession) return;
  if (!user) redirect(BLOCKED_ACCOUNT_REDIRECT);
  if (requiresAdmin(pathname) && user.role !== "ADMIN" && !user.isSuperAdmin) redirect("/");
}

export async function getCurrentUser() {
  const { user } = await getCurrentUserWithTeam();
  return user;
}

export async function getCurrentUserWithTeam() {
  const user = await requireActiveUser();

  const cookieStore = await cookies();

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
