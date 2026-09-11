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
  const attendedCount = trainingRegistrations.filter((registration) => registration.attended).length;
  return {
    matchesPlayed: matchStats.length,
    goals,
    assists,
    points: goals + assists,
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
