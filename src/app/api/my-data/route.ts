import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return Response.json({ error: "Du måste vara inloggad." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      heightCm: true,
      weightKg: true,
      stickSide: true,
      createdAt: true,
      teams: {
        select: {
          jerseyNo: true,
          position: true,
          playingThisSeason: true,
          participatesInMatches: true,
          trainingDays: true,
          team: { select: { name: true, season: true } },
        },
      },
      trainingRegistrations: {
        select: {
          status: true,
          absenceReason: true,
          attended: true,
          createdAt: true,
          training: {
            select: {
              startsAt: true,
              location: true,
              notes: true,
              team: { select: { name: true, season: true } },
            },
          },
        },
      },
      matchRegistrations: {
        select: {
          status: true,
          absenceReason: true,
          createdAt: true,
          match: {
            select: {
              opponent: true,
              isHome: true,
              startsAt: true,
              location: true,
              team: { select: { name: true, season: true } },
            },
          },
        },
      },
      matchStats: {
        select: {
          goals: true,
          assists: true,
          penaltyMinutes: true,
          match: {
            select: {
              opponent: true,
              startsAt: true,
              team: { select: { name: true, season: true } },
            },
          },
        },
      },
      highlights: {
        select: {
          title: true,
          url: true,
          createdAt: true,
          team: { select: { name: true, season: true } },
        },
      },
    },
  });

  if (!user) {
    return Response.json({ error: "Användaren kunde inte hittas." }, { status: 404 });
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    service: "Istid",
    account: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      heightCm: user.heightCm,
      weightKg: user.weightKg,
      stickSide: user.stickSide,
      createdAt: user.createdAt,
    },
    memberships: user.teams,
    trainingRegistrations: user.trainingRegistrations,
    matchRegistrations: user.matchRegistrations,
    matchStats: user.matchStats,
    authoredHighlights: user.highlights,
  };
  const date = new Date().toISOString().slice(0, 10);

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="istid-mina-uppgifter-${date}.json"`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
