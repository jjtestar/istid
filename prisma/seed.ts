import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;
const CURRENT_SEASON = "2026/27";

const teams = [
  {
    slug: "kumla",
    name: "Kumla hockeylag",
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
    name: "Hallsberg hockeylag",
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
    name: "Fellingsbro hockeylag",
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

function gameStats(
  playerIndex: number,
  matchIndex: number,
  teamIndex: number,
  seasonIndex: number,
  ownScore: number,
) {
  if (playerIndex === 4) {
    return {
      goals: 0,
      assists: ownScore > 0 && (matchIndex + teamIndex + seasonIndex) % 5 === 0 ? 1 : 0,
      penaltyMinutes: (matchIndex + teamIndex + seasonIndex) % 7 === 0 ? 2 : 0,
    };
  }

  let goals = 0;
  let assists = 0;
  for (let goalIndex = 0; goalIndex < ownScore; goalIndex += 1) {
    const scorer = (goalIndex * 3 + matchIndex + teamIndex + seasonIndex) % 4;
    const primaryAssist = (scorer + 1 + (matchIndex % 2)) % 4;
    const secondaryAssist = (scorer + 2 + (teamIndex % 2)) % 4;
    if (scorer === playerIndex) goals += 1;
    if (primaryAssist === playerIndex) assists += 1;
    if (secondaryAssist !== primaryAssist && secondaryAssist !== scorer && secondaryAssist === playerIndex) {
      assists += 1;
    }
  }

  const penaltySeed = playerIndex * 3 + matchIndex + teamIndex + seasonIndex;
  return {
    goals,
    assists,
    penaltyMinutes: penaltySeed % 5 === 0 ? 4 : penaltySeed % 3 === 0 ? 2 : 0,
  };
}

async function main() {
  const passwordHash = await bcrypt.hash("istid1234", 10);

  await prisma.team.deleteMany({ where: { name: "A-laget" } });

  for (const [teamIndex, teamDefinition] of teams.entries()) {
    for (const player of teamDefinition.players) {
      const [id, name, email] = player;
      await prisma.user.upsert({
        where: { id },
        update: { name, email, passwordHash, role: id === "user-johan" ? "ADMIN" : "PLAYER", accessApproved: true },
        create: { id, name, email, passwordHash, role: id === "user-johan" ? "ADMIN" : "PLAYER", accessApproved: true },
      });
    }

    for (const [seasonIndex, season] of seasons.entries()) {
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
            playingThisSeason: true,
            participatesInMatches: true,
            trainingDays: ["TUESDAY", "THURSDAY", "SATURDAY"],
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
          const attendanceSeed = playerIndex * 2 + trainingIndex + teamIndex + seasonIndex;
          const attended = attendanceSeed % (playerIndex === 4 ? 4 : 6) !== 0;
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
        const [ownScore, opponentScore] = results[(teamIndex + seasonIndex) % results.length][matchIndex];
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
          const { goals, assists, penaltyMinutes } = gameStats(
            playerIndex,
            matchIndex,
            teamIndex,
            seasonIndex,
            ownScore,
          );
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

  console.log("Seeded three hockey teams across three seasons with individual player statistics.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
