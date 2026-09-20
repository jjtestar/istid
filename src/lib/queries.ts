import { prisma } from "@/lib/prisma";

export async function getDashboardData(userId: string, teamId: string) {
  const now = new Date();
  const [nextTraining, nextMatch, roster] = await Promise.all([
    prisma.training.findFirst({
      where: { teamId, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      include: { registrations: true },
    }),
    prisma.match.findFirst({
      where: { teamId, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      include: { registrations: true },
    }),
    prisma.teamMember.findMany({
      where: { teamId },
      include: { user: true },
      orderBy: { jerseyNo: "asc" },
    }),
  ]);
  return { nextTraining, nextMatch, roster, currentUserId: userId };
}

export async function getCalendarEvents(userId: string, teamId: string, days = 21, historic = false) {
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const dateFilter = historic ? { lte: now } : { gte: now, lte: until };
  const [trainings, matches] = await Promise.all([
    prisma.training.findMany({
      where: { teamId, startsAt: dateFilter },
      orderBy: { startsAt: historic ? "desc" : "asc" },
      take: historic ? days : undefined,
      include: { registrations: { where: { userId } } },
    }),
    prisma.match.findMany({
      where: { teamId, startsAt: dateFilter },
      orderBy: { startsAt: historic ? "desc" : "asc" },
      take: historic ? days : undefined,
      include: { registrations: { where: { userId } } },
    }),
  ]);
  return [
    ...trainings.map((item) => ({ kind: "training" as const, item })),
    ...matches.map((item) => ({ kind: "match" as const, item })),
  ].sort((a, b) =>
    historic
      ? b.item.startsAt.getTime() - a.item.startsAt.getTime()
      : a.item.startsAt.getTime() - b.item.startsAt.getTime(),
  );
}

type TeamRef = { id: string; name: string };

/**
 * Next training/match per team, each tagged with which team it belongs to —
 * used to build an aggregated "featured activities" list across every team
 * a player is assigned to, instead of a single selected team.
 */
export async function getUpcomingByTeam(teams: TeamRef[]) {
  const now = new Date();
  return Promise.all(
    teams.map(async (team) => {
      // Only what the Anmälan card renders. Selecting whole rows made Postgres
      // return every column of every roster member and registration on each
      // render of this page, most of which the card never looks at.
      const registrations = {
        select: { userId: true, status: true, absenceReason: true },
      } as const;
      const [nextTraining, nextMatch, roster] = await Promise.all([
        prisma.training.findFirst({
          where: { teamId: team.id, startsAt: { gte: now } },
          orderBy: { startsAt: "asc" },
          include: { registrations, lineupPlan: true },
        }),
        prisma.match.findFirst({
          where: { teamId: team.id, startsAt: { gte: now } },
          orderBy: { startsAt: "asc" },
          include: { registrations, lineupPlan: true },
        }),
        prisma.teamMember.findMany({
          where: { teamId: team.id },
          select: { userId: true, jerseyNo: true, position: true, user: { select: { name: true } } },
          orderBy: { jerseyNo: "asc" },
        }),
      ]);
      return { team, nextTraining, nextMatch, roster };
    }),
  );
}

/** Same as getCalendarEvents but aggregated across several teams at once, each event tagged with its team. */
export async function getCalendarEventsForTeams(
  userId: string,
  teamIds: string[],
  days = 21,
  historic = false,
) {
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const dateFilter = historic ? { lte: now } : { gte: now, lte: until };
  const [trainings, matches] = await Promise.all([
    prisma.training.findMany({
      where: { teamId: { in: teamIds }, startsAt: dateFilter },
      orderBy: { startsAt: historic ? "desc" : "asc" },
      take: historic ? days : undefined,
      include: {
        registrations: { where: { userId }, select: { status: true } },
        team: { select: { id: true, name: true } },
      },
    }),
    prisma.match.findMany({
      where: { teamId: { in: teamIds }, startsAt: dateFilter },
      orderBy: { startsAt: historic ? "desc" : "asc" },
      take: historic ? days : undefined,
      include: {
        registrations: { where: { userId }, select: { status: true } },
        team: { select: { id: true, name: true } },
      },
    }),
  ]);
  return [
    ...trainings.map((item) => ({ kind: "training" as const, item })),
    ...matches.map((item) => ({ kind: "match" as const, item })),
  ].sort((a, b) =>
    historic
      ? b.item.startsAt.getTime() - a.item.startsAt.getTime()
      : a.item.startsAt.getTime() - b.item.startsAt.getTime(),
  );
}

/** Latest admin-published information targeted at a specific team. */
export async function getAnnouncementsForTeam(teamId: string, take = 5) {
  return prisma.announcement.findMany({
    where: { teams: { some: { id: teamId } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/** Unresolved "söker spelare" flags for a set of teams' still-upcoming activities. */
export async function getActivePlayerRequests(teamIds: string[]) {
  const now = new Date();
  return prisma.playerRequest.findMany({
    where: {
      teamId: { in: teamIds },
      resolvedAt: null,
      OR: [{ training: { startsAt: { gte: now } } }, { match: { startsAt: { gte: now } } }],
    },
    include: { team: true, training: true, match: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStats(userId: string, teamId: string) {
  const [matchStats, trainingRegistrations] = await Promise.all([
    prisma.matchStat.findMany({
      where: { userId, match: { teamId } },
      include: { match: true },
      orderBy: { match: { startsAt: "desc" } },
    }),
    prisma.trainingRegistration.findMany({
      where: { userId, attended: { not: null }, training: { teamId } },
    }),
  ]);
  const goals = matchStats.reduce((sum, stat) => sum + stat.goals, 0);
  const assists = matchStats.reduce((sum, stat) => sum + stat.assists, 0);
  const penaltyMinutes = matchStats.reduce((sum, stat) => sum + stat.penaltyMinutes, 0);
  const attendedCount = trainingRegistrations.filter((registration) => registration.attended).length;
  return {
    matchesPlayed: matchStats.length,
    goals,
    assists,
    points: goals + assists,
    penaltyMinutes,
    recentMatches: matchStats.slice(0, 4),
    trainingsAttended: attendedCount,
    trainingsTotal: trainingRegistrations.length,
    attendancePct: trainingRegistrations.length
      ? Math.round((attendedCount / trainingRegistrations.length) * 100)
      : 0,
  };
}

export async function getTeamRoster(teamId: string) {
  return prisma.teamMember.findMany({
    where: { teamId },
    include: { user: true },
    orderBy: { jerseyNo: "asc" },
  });
}

export async function getRosterWithNextMatch(teamId: string) {
  const now = new Date();
  const [roster, nextMatch] = await Promise.all([
    getTeamRoster(teamId),
    prisma.match.findFirst({
      where: { teamId, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      include: { registrations: true },
    }),
  ]);
  const statusByUser = new Map(nextMatch?.registrations.map((registration) => [registration.userId, registration.status]) ?? []);
  const respondedGoing = nextMatch?.registrations.filter((registration) => registration.status === "GOING").length ?? 0;
  return { roster, nextMatch, statusByUser, respondedGoing };
}

export async function getTeamStats(teamId: string) {
  const [matches, roster, matchStats] = await Promise.all([
    prisma.match.findMany({
      where: { teamId, homeScore: { not: null }, awayScore: { not: null } },
      orderBy: { startsAt: "desc" },
    }),
    getTeamRoster(teamId),
    prisma.matchStat.findMany({ where: { match: { teamId } } }),
  ]);

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  for (const match of matches) {
    const own = match.isHome ? match.homeScore! : match.awayScore!;
    const opponent = match.isHome ? match.awayScore! : match.homeScore!;
    goalsFor += own;
    goalsAgainst += opponent;
    if (own > opponent) wins += 1;
    else if (own === opponent) draws += 1;
    else losses += 1;
  }

  const playerStats = roster
    .map((member) => {
      const stats = matchStats.filter((stat) => stat.userId === member.userId);
      const goals = stats.reduce((sum, stat) => sum + stat.goals, 0);
      const assists = stats.reduce((sum, stat) => sum + stat.assists, 0);
      return {
        id: member.id,
        userId: member.userId,
        name: member.user.name,
        jerseyNo: member.jerseyNo,
        position: member.position,
        matches: stats.length,
        goals,
        assists,
        points: goals + assists,
        penaltyMinutes: stats.reduce((sum, stat) => sum + stat.penaltyMinutes, 0),
      };
    })
    .sort((a, b) => b.points - a.points || b.goals - a.goals || (a.jerseyNo ?? 999) - (b.jerseyNo ?? 999));

  return {
    matches: matches.length,
    wins,
    draws,
    losses,
    points: wins * 3 + draws,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    playerStats,
  };
}

export async function getTeamHighlights(teamId: string) {
  return prisma.highlight.findMany({
    where: { teamId },
    include: {
      author: { select: { id: true, name: true } },
      players: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
}

/** Highlights grouped by which match/training they were filmed at (or by date, if not linked to one), most recent occasion first. */
export async function getGroupedTeamHighlights(teamId: string) {
  const highlights = await prisma.highlight.findMany({
    where: { teamId },
    include: {
      author: { select: { id: true, name: true } },
      training: true,
      match: true,
      players: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const groups = new Map<string, { key: string; date: Date; label: string; items: typeof highlights }>();
  for (const highlight of highlights) {
    const key = highlight.trainingId
      ? `training:${highlight.trainingId}`
      : highlight.matchId
        ? `match:${highlight.matchId}`
        : `date:${highlight.createdAt.toDateString()}`;
    const date = highlight.training?.startsAt ?? highlight.match?.startsAt ?? highlight.createdAt;
    const label = highlight.training
      ? `Träning · ${highlight.training.location}`
      : highlight.match
        ? `${highlight.match.isHome ? "Hemma" : "Borta"} vs ${highlight.match.opponent}`
        : "Klipp";
    if (!groups.has(key)) groups.set(key, { key, date, label, items: [] });
    groups.get(key)!.items.push(highlight);
  }

  return Array.from(groups.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
}
