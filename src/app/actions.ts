"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

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
