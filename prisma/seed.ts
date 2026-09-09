import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function atTime(date: Date, hour: number, minute = 0) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function nextWeekday(from: Date, weekday: number, hour: number) {
  const d = atTime(from, hour);
  let diff = (weekday - d.getDay() + 7) % 7;
  if (diff === 0 && d.getTime() <= from.getTime()) diff = 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function pastTrainingDates(before: Date, count: number) {
  const dates: Date[] = [];
  const cursor = new Date(before);
  while (dates.length < count) {
    cursor.setTime(cursor.getTime() - DAY);
    if (cursor.getDay() === 2 || cursor.getDay() === 4) {
      dates.push(atTime(cursor, 20));
    }
  }
  return dates.reverse();
}

async function main() {
  const now = new Date();

  const team = await prisma.team.upsert({
    where: { id: "team-a-laget" },
    update: {},
    create: { id: "team-a-laget", name: "A-laget", season: "2026/27" },
  });

  const passwordHash = await bcrypt.hash("istid1234", 10);
  const johan = await prisma.user.upsert({
    where: { id: "user-johan" },
    update: {},
    create: {
      id: "user-johan",
      name: "Johan",
      email: "johan@example.com",
      passwordHash,
      role: "PLAYER",
    },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: johan.id } },
    update: { jerseyNo: 22, position: "Forward" },
    create: { id: "member-johan", teamId: team.id, userId: johan.id, jerseyNo: 22, position: "Forward" },
  });

  // Past trainings: 20 sessions, 17 attended, 3 missed.
  const pastTrainings = pastTrainingDates(now, 20);
  for (const [i, startsAt] of pastTrainings.entries()) {
    const id = `training-past-${i}`;
    const attended = ![0, 7, 14].includes(i); // 17/20 attended
    await prisma.training.upsert({
      where: { id },
      update: {},
      create: { id, teamId: team.id, startsAt, location: "Ishallen" },
    });
    await prisma.trainingRegistration.upsert({
      where: { trainingId_userId: { trainingId: id, userId: johan.id } },
      update: { attended },
      create: { trainingId: id, userId: johan.id, status: "GOING", attended },
    });
  }

  // Upcoming trainings: one confirmed, one awaiting response.
  const upcomingTue = nextWeekday(now, 2, 20);
  const upcomingThu = nextWeekday(now, 4, 20);

  await prisma.training.upsert({
    where: { id: "training-upcoming-1" },
    update: { startsAt: upcomingTue },
    create: { id: "training-upcoming-1", teamId: team.id, startsAt: upcomingTue, location: "Ishallen" },
  });
  await prisma.trainingRegistration.upsert({
    where: { trainingId_userId: { trainingId: "training-upcoming-1", userId: johan.id } },
    update: {},
    create: { trainingId: "training-upcoming-1", userId: johan.id, status: "GOING" },
  });

  await prisma.training.upsert({
    where: { id: "training-upcoming-2" },
    update: { startsAt: upcomingThu },
    create: { id: "training-upcoming-2", teamId: team.id, startsAt: upcomingThu, location: "Ishallen" },
  });

  // Next match: not yet registered, matches the "Jag är tillgänglig" dashboard CTA.
  const nextMatchDate = nextWeekday(now, 0, 19);
  await prisma.match.upsert({
    where: { id: "match-next" },
    update: { startsAt: nextMatchDate },
    create: {
      id: "match-next",
      teamId: team.id,
      opponent: "Bortalaget",
      isHome: true,
      startsAt: nextMatchDate,
      location: "Ishallen",
    },
  });

  // Past matches with per-player stats (12 matches, 8 goals, 6 assists = 14 points).
  const pastMatches: { opponent: string; isHome: boolean; goals: number; assists: number }[] = [
    { opponent: "Örnsköld", isHome: true, goals: 2, assists: 1 },
    { opponent: "Skogsdalen", isHome: false, goals: 1, assists: 0 },
    { opponent: "Tallviken", isHome: true, goals: 0, assists: 2 },
    { opponent: "Länna", isHome: false, goals: 1, assists: 1 },
    { opponent: "Björkhaga", isHome: true, goals: 1, assists: 0 },
    { opponent: "Sjöstad", isHome: false, goals: 1, assists: 0 },
    { opponent: "Furulund", isHome: true, goals: 1, assists: 1 },
    { opponent: "Kvarnby", isHome: false, goals: 1, assists: 0 },
    { opponent: "Ekbacken", isHome: true, goals: 0, assists: 1 },
    { opponent: "Sandvik", isHome: false, goals: 0, assists: 0 },
    { opponent: "Granliden", isHome: true, goals: 0, assists: 0 },
    { opponent: "Rosengård", isHome: false, goals: 0, assists: 0 },
  ];

  for (const [i, m] of pastMatches.entries()) {
    const id = `match-past-${i}`;
    const startsAt = new Date(now.getTime() - (i + 1) * 7 * DAY);
    await prisma.match.upsert({
      where: { id },
      update: {},
      create: { id, teamId: team.id, opponent: m.opponent, isHome: m.isHome, startsAt, location: "Ishallen" },
    });
    await prisma.matchRegistration.upsert({
      where: { matchId_userId: { matchId: id, userId: johan.id } },
      update: {},
      create: { matchId: id, userId: johan.id, status: "GOING" },
    });
    await prisma.matchStat.upsert({
      where: { matchId_userId: { matchId: id, userId: johan.id } },
      update: { goals: m.goals, assists: m.assists },
      create: { matchId: id, userId: johan.id, goals: m.goals, assists: m.assists },
    });
  }

  console.log(`Seeded team "${team.name}" with player ${johan.name}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
