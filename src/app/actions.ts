"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUser, teamSlug } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function changeAppContext(formData: FormData) {
  await getCurrentUser();
  const requestedTeam = String(formData.get("teamSlug") ?? "");
  const requestedSeason = String(formData.get("season") ?? "");
  const availableTeams = await prisma.team.findMany({ select: { name: true, season: true } });
  const selectionExists = availableTeams.some(
    (team) => teamSlug(team.name) === requestedTeam && team.season === requestedSeason,
  );

  if (!selectionExists) return;

  const cookieStore = await cookies();
  const options = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 365 };
  cookieStore.set("istid-team", requestedTeam, options);
  cookieStore.set("istid-season", requestedSeason, options);
  revalidatePath("/", "layout");
}

export async function respondToTraining(formData: FormData) {
  const trainingId = formData.get("trainingId") as string;
  const status = formData.get("status") as "GOING" | "NOT_GOING";
  const user = await getCurrentUser();

  await prisma.trainingRegistration.upsert({
    where: { trainingId_userId: { trainingId, userId: user.id } },
    update: { status },
    create: { trainingId, userId: user.id, status },
  });

  revalidatePath("/");
  revalidatePath("/kalender");
}

export async function respondToMatch(formData: FormData) {
  const matchId = formData.get("matchId") as string;
  const status = formData.get("status") as "GOING" | "NOT_GOING";
  const user = await getCurrentUser();

  await prisma.matchRegistration.upsert({
    where: { matchId_userId: { matchId, userId: user.id } },
    update: { status },
    create: { matchId, userId: user.id, status },
  });

  revalidatePath("/");
  revalidatePath("/kalender");
}
