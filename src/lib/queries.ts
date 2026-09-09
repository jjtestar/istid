import { prisma } from "@/lib/prisma";

export async function getUserTeam(userId: string) {
  const membership = await prisma.teamMember.findFirst({
    where: { userId },
    include: { team: true },
  });
  return membership?.team ?? null;
}

export async function getDashboardData(userId: string, teamId: string) {
  const now = new Date();

  const [nextTraining, nextMatch] = await Promise.all([
    prisma.training.findFirst({
      where: { teamId, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      include: { registrations: { where: { userId } } },
    }),
    prisma.match.findFirst({
      where: { teamId, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      include: { registrations: { where: { userId } } },
    }),
  ]);

  return { nextTraining, nextMatch };
}

export async function getCalendarEvents(userId: string, teamId: string, days = 21) {
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const [trainings, matches] = await Promise.all([
    prisma.training.findMany({
      where: { teamId, startsAt: { gte: now, lte: until } },
      orderBy: { startsAt: "asc" },
      include: { registrations: { where: { userId } } },
    }),
    prisma.match.findMany({
      where: { teamId, startsAt: { gte: now, lte: until } },
      orderBy: { startsAt: "asc" },
      include: { registrations: { where: { userId } } },
    }),
  ]);

  const events = [
    ...trainings.map((t) => ({ kind: "training" as const, item: t })),
    ...matches.map((m) => ({ kind: "match" as const, item: m })),
  ].sort((a, b) => a.item.startsAt.getTime() - b.item.startsAt.getTime());

  return events;
}

export async function getStats(userId: string) {
  const [matchStats, trainingRegistrations] = await Promise.all([
    prisma.matchStat.findMany({
      where: { userId },
      include: { match: true },
      orderBy: { match: { startsAt: "desc" } },
    }),
    prisma.trainingRegistration.findMany({
      where: { userId, attended: { not: null } },
    }),
  ]);

  const goals = matchStats.reduce((sum, s) => sum + s.goals, 0);
  const assists = matchStats.reduce((sum, s) => sum + s.assists, 0);
  const attendedCount = trainingRegistrations.filter((r) => r.attended).length;

  return {
    matchesPlayed: matchStats.length,
    goals,
    assists,
    points: goals + assists,
    recentMatches: matchStats.slice(0, 4),
    trainingsAttended: attendedCount,
    trainingsTotal: trainingRegistrations.length,
    attendancePct:
      trainingRegistrations.length === 0
        ? 0
        : Math.round((attendedCount / trainingRegistrations.length) * 100),
  };
}

export async function getTeamMember(teamId: string, userId: string) {
  return prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
}

export async function getTeamRoster(teamId: string) {
  return prisma.teamMember.findMany({
    where: { teamId },
    include: { user: true },
    orderBy: { jerseyNo: "asc" },
  });
}
