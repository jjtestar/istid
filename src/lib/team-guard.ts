import { DEFAULT_SEASON } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

/**
 * Whether a team may receive new or changed content: current season and not
 * archived. Past seasons and archived teams are read-only history — every
 * team-scoped write (activities, invites, highlights, team edits) must go
 * through this, not just the UI that happens to filter for it.
 */
export function isMutableTeam(team: { season: string; archivedAt: Date | null }) {
  return team.season === DEFAULT_SEASON && team.archivedAt === null;
}

/** Loads a team by id and returns it only if it's still mutable, otherwise null. */
export async function findMutableTeam(teamId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true, name: true, season: true, archivedAt: true } });
  return team && isMutableTeam(team) ? team : null;
}
