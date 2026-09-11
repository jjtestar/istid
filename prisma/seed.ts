import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;
const CURRENT_SEASON = "2026/27";

const teams = [
  {
    slug: "kumla",
    name: "Kumla",
    rink: "Kumla ishall",
    players: [
      ["user-johan", "Johan Berg", "johan@example.com", 22, "Forward"],
      ["player-kumla-2", "Elias Sandberg", "elias.sandberg@example.com", 9, "Forward"],
      ["player-kumla-3", "Viktor Lundqvist", "viktor.lundqvist@example.com", 14, "Forward"],
      ["player-kumla-4", "Marcus Holm", "marcus.holm@example.com", 4, "Back"],
      ["player-kumla-5", "Anton Sjögren", "anton.sjogren@example.com", 30, "Målvakt"],
    ],
  },
  {
    slug: "hallsberg",
    name: "Hallsberg",
    rink: "Sydnärkehallen",
    players: [
      ["player-hallsberg-1", "Oskar Lind", "oskar.lind@example.com", 7, "Forward"],
      ["player-hallsberg-2", "William Ek", "william.ek@example.com", 11, "Forward"],
      ["player-hallsberg-3", "Noah Karlsson", "noah.karlsson@example.com", 19, "Forward"],
      ["player-hallsberg-4", "Albin Nyström", "albin.nystrom@example.com", 5, "Back"],
      ["player-hallsberg-5", "Filip Rosén", "filip.rosen@example.com", 35, "Målvakt"],
    ],
  },
  {
    slug: "fellingsbro",
    name: "Fellingsbro",
    rink: "Fellingsbro isarena",
    players: [
      ["player-fellingsbro-1", "Hugo Andersson", "hugo.andersson@example.com", 8, "Forward"],
      ["player-fellingsbro-2", "Leo Persson", "leo.persson@example.com", 12, "Forward"],
      ["player-fellingsbro-3", "Nils Eriksson", "nils.eriksson@example.com", 21, "Forward"],
      ["player-fellingsbro-4", "Axel Gustafsson", "axel.gustafsson@example.com", 6, "Back"],
      ["player-fellingsbro-5", "Melvin Larsson", "melvin.larsson@example.com", 31, "Målvakt"],
    ],
  },
] as const;

const seasons = ["2024/25", "2025/26", CURRENT_SEASON] as const;
const opponents = ["Lindesberg", "Nora", "Örebro", "Karlskoga", "Arboga", "Köping"];
const results = [
  [[5, 2], [3, 1], [2, 2], [4, 3], [1, 3], [6, 2]],
  [[2, 4], [4, 2], [3, 3], [1, 2], [5, 1], [3, 2]],
  [[1, 3], [2, 1], [4, 2], [2, 2], [3, 4], [5, 3]],
] as const;

function safeSeason(season: string) {
  return season.replace("/", "-");
}

function eventDate(season: string, index: number) {
  if (season === CURRENT_SEASON) return new Date(Date.now() - (index + 1) * 7 * DAY);
  const endYear = 2000 + Number(season.slice(-2));
  return new Date(endYear, 0, 18 + index * 7, 18, 30);
}

function nextWeekday(weekday: number, hour: number) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  let difference = (weekday - date.getDay() + 7) % 7;
  if (difference === 0 && date.getTime() <= Date.now()) difference = 7;
  date.setDate(date.getDate() + difference);
  return date;
}

async function main() {
  const passwordHash = await bcrypt.hash("istid1234", 10);

  // The user explicitly replaced the original demo team with the three clubs below.
  await prisma.team.deleteMany({ where: { name: "A-laget" } });

  for (const [teamIndex, teamDefinition] of teams.entries()) {
    for (const player of teamDefinition.players) {
      const [id, name, email] = player;
      await prisma.user.upsert({
        where: { id },
        update: { name, email, passwordHash, role: "PLAYER" },
        create: { id, name, email, passwordHash, role: "PLAYER" },
      });
    }

    for (const season of seasons) {
      const seasonKey = safeSeason(season);
      const teamId = `team-${teamDefinition.slug}-${seasonKey}`;
      await prisma.team.upsert({
        where: { id: teamId },
        update: { name: teamDefinition.name, season },
        create: { id: teamId, name: teamDefinition.name, season },
      });

      for (const player of teamDefinition.players) {
        const [userId, , , jerseyNo, position] = player;
        await prisma.teamMember.upsert({
          where: { teamId_userId: { teamId, userId } },
          update: { jerseyNo, position },
          create: {
            id: `member-${teamDefinition.slug}-${seasonKey}-${userId}`,
            teamId,
            userId,
            jerseyNo,
            position,
          },
        });
      }

      for (let trainingIndex = 0; trainingIndex < 6; trainingIndex += 1) {
        const trainingId = `training-${teamDefinition.slug}-${seasonKey}-${trainingIndex}`;
        const startsAt = new Date(eventDate(season, trainingIndex).getTime() - 2 * DAY);
        await prisma.training.upsert({
          where: { id: trainingId },
          update: { teamId, startsAt, location: teamDefinition.rink },
          create: { id: trainingId, teamId, startsAt, location: teamDefinition.rink },
        });
        for (const [playerIndex, player] of teamDefinition.players.entries()) {
          const userId = player[0];
          const attended = (playerIndex + trainingIndex + teamIndex) % 5 !== 0;
          await prisma.trainingRegistration.upsert({
            where: { trainingId_userId: { trainingId, userId } },
            update: { status: "GOING", attended },
            create: { trainingId, userId, status: "GOING", attended },
          });
        }
      }

      for (let matchIndex = 0; matchIndex < opponents.length; matchIndex += 1) {
        const matchId = `match-${teamDefinition.slug}-${seasonKey}-${matchIndex}`;
        const isHome = matchIndex % 2 === 0;
        const [ownScore, opponentScore] = results[(teamIndex + seasons.indexOf(season)) % results.length][matchIndex];
        const homeScore = isHome ? ownScore : opponentScore;
        const awayScore = isHome ? opponentScore : ownScore;
        await prisma.match.upsert({
          where: { id: matchId },
          update: {
            teamId,
            opponent: opponents[(matchIndex + teamIndex) % opponents.length],
            isHome,
            startsAt: eventDate(season, matchIndex),
            location: isHome ? teamDefinition.rink : `${opponents[(matchIndex + teamIndex) % opponents.length]} ishall`,
            homeScore,
            awayScore,
          },
          create: {
            id: matchId,
            teamId,
            opponent: opponents[(matchIndex + teamIndex) % opponents.length],
            isHome,
            startsAt: eventDate(season, matchIndex),
            location: isHome ? teamDefinition.rink : `${opponents[(matchIndex + teamIndex) % opponents.length]} ishall`,
            homeScore,
            awayScore,
          },
        });

        for (const [playerIndex, player] of teamDefinition.players.entries()) {
          const userId = player[0];
          const goals = playerIndex < 4 ? Math.floor(ownScore / 4) + (playerIndex < ownScore % 4 ? 1 : 0) : 0;
          const assists = playerIndex < 4 && ownScore > 0 && (playerIndex + matchIndex) % 2 === 0 ? 1 : 0;
          const penaltyMinutes = (playerIndex + matchIndex + teamIndex) % 6 === 0 ? 2 : 0;
          await prisma.matchRegistration.upsert({
            where: { matchId_userId: { matchId, userId } },
            update: { status: "GOING" },
            create: { matchId, userId, status: "GOING" },
          });
          await prisma.matchStat.upsert({
            where: { matchId_userId: { matchId, userId } },
            update: { goals, assists, penaltyMinutes },
            create: { matchId, userId, goals, assists, penaltyMinutes },
          });
        }
      }

      if (season === CURRENT_SEASON) {
        const futureTrainingId = `training-${teamDefinition.slug}-${seasonKey}-next`;
        const futureMatchId = `match-${teamDefinition.slug}-${seasonKey}-next`;
        await prisma.training.upsert({
          where: { id: futureTrainingId },
          update: { teamId, startsAt: nextWeekday(2, 20), location: teamDefinition.rink },
          create: { id: futureTrainingId, teamId, startsAt: nextWeekday(2, 20), location: teamDefinition.rink },
        });
        await prisma.match.upsert({
          where: { id: futureMatchId },
          update: {
            teamId,
            opponent: opponents[(teamIndex + 1) % opponents.length],
            isHome: true,
            startsAt: nextWeekday(0, 18),
            location: teamDefinition.rink,
            homeScore: null,
            awayScore: null,
          },
          create: {
            id: futureMatchId,
            teamId,
            opponent: opponents[(teamIndex + 1) % opponents.length],
            isHome: true,
            startsAt: nextWeekday(0, 18),
            location: teamDefinition.rink,
          },
        });
      }
    }
  }

  console.log("Seeded Kumla, Hallsberg and Fellingsbro across three seasons with 15 players.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
