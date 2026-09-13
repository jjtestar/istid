"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUser, getCurrentUserWithTeam, teamSlug } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const RSVP_STATUSES = new Set(["GOING", "NOT_GOING"]);
const ABSENCE_REASONS = new Set(["TIRED", "SICK", "VACATION", "OTHER"]);
const PLAYER_POSITIONS = new Set(["Forward", "Back", "Målvakt"]);
const STICK_SIDES = new Set(["LEFT", "RIGHT"]);
const PARTICIPATION_TYPES = new Set(["TRAINING_AND_MATCHES", "TRAINING_ONLY"]);
const TRAINING_DAYS = new Set(["TUESDAY", "THURSDAY", "SATURDAY"]);

function getResponse(formData: FormData) {
  const status = String(formData.get("status") ?? "");
  const requestedReason = String(formData.get("absenceReason") ?? "");

  if (!RSVP_STATUSES.has(status)) return null;
  if (status === "NOT_GOING" && !ABSENCE_REASONS.has(requestedReason)) return null;

  return {
    status: status as "GOING" | "NOT_GOING",
    absenceReason: status === "NOT_GOING" ? requestedReason : null,
  };
}

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
  const trainingId = String(formData.get("trainingId") ?? "");
  const response = getResponse(formData);
  if (!trainingId || !response) return;
  const user = await getCurrentUser();

  await prisma.trainingRegistration.upsert({
    where: { trainingId_userId: { trainingId, userId: user.id } },
    update: response,
    create: { trainingId, userId: user.id, ...response },
  });

  revalidatePath("/");
  revalidatePath("/anmalan");
  revalidatePath("/kalender");
}

export async function respondToMatch(formData: FormData) {
  const matchId = String(formData.get("matchId") ?? "");
  const response = getResponse(formData);
  if (!matchId || !response) return;
  const user = await getCurrentUser();

  await prisma.matchRegistration.upsert({
    where: { matchId_userId: { matchId, userId: user.id } },
    update: response,
    create: { matchId, userId: user.id, ...response },
  });

  revalidatePath("/");
  revalidatePath("/anmalan");
  revalidatePath("/kalender");
}

export async function updateProfile(formData: FormData) {
  const { user, membership } = await getCurrentUserWithTeam();
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const jerseyValue = String(formData.get("jerseyNo") ?? "").trim();
  const heightValue = String(formData.get("heightCm") ?? "").trim();
  const weightValue = String(formData.get("weightKg") ?? "").trim();
  const requestedStickSide = String(formData.get("stickSide") ?? "").trim();

  if (!name) return;

  const parsedJerseyNo = jerseyValue === "" ? null : Number(jerseyValue);
  const jerseyNo =
    parsedJerseyNo !== null && Number.isInteger(parsedJerseyNo) && parsedJerseyNo >= 0 && parsedJerseyNo <= 99
      ? parsedJerseyNo
      : null;
  const parsedHeightCm = heightValue === "" ? null : Number(heightValue);
  const heightCm =
    parsedHeightCm !== null && Number.isInteger(parsedHeightCm) && parsedHeightCm >= 80 && parsedHeightCm <= 230
      ? parsedHeightCm
      : parsedHeightCm === null
        ? null
        : undefined;
  const parsedWeightKg = weightValue === "" ? null : Number(weightValue);
  const weightKg =
    parsedWeightKg !== null && Number.isFinite(parsedWeightKg) && parsedWeightKg >= 20 && parsedWeightKg <= 250
      ? Math.round(parsedWeightKg * 10) / 10
      : parsedWeightKg === null
        ? null
        : undefined;
  const stickSide = STICK_SIDES.has(requestedStickSide)
    ? (requestedStickSide as "LEFT" | "RIGHT")
    : requestedStickSide === ""
      ? null
      : undefined;

  if (heightCm === undefined || weightKg === undefined || stickSide === undefined) return;

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { name, heightCm, weightKg, stickSide } }),
    ...(membership
      ? [prisma.teamMember.update({ where: { id: membership.id }, data: { jerseyNo } })]
      : []),
  ]);

  revalidatePath("/");
  revalidatePath("/lag");
  revalidatePath("/statistik");
  revalidatePath("/min-profil");
}

export async function updateSeasonParticipation(formData: FormData) {
  const { membership } = await getCurrentUserWithTeam();
  const response = String(formData.get("playingThisSeason") ?? "");

  if (!membership || (response !== "yes" && response !== "no")) return;

  if (response === "no") {
    await prisma.teamMember.update({
      where: { id: membership.id },
      data: {
        playingThisSeason: false,
        participatesInMatches: false,
        trainingDays: [],
      },
    });
  } else {
    const participationType = String(formData.get("participationType") ?? "");
    const requestedTrainingDays = formData
      .getAll("trainingDays")
      .map(String)
      .filter((day) => TRAINING_DAYS.has(day));
    const trainingDays = [...new Set(requestedTrainingDays)] as (
      | "TUESDAY"
      | "THURSDAY"
      | "SATURDAY"
    )[];

    if (!PARTICIPATION_TYPES.has(participationType) || trainingDays.length === 0) return;

    await prisma.teamMember.update({
      where: { id: membership.id },
      data: {
        playingThisSeason: true,
        participatesInMatches: participationType === "TRAINING_AND_MATCHES",
        trainingDays,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/lag");
  revalidatePath("/min-profil");
}

export async function updateMemberPosition(formData: FormData) {
  const { user, team } = await getCurrentUserWithTeam();
  const membershipId = String(formData.get("membershipId") ?? "");
  const requestedPosition = String(formData.get("position") ?? "").trim();

  if (user.role !== "ADMIN" || !team || !membershipId) return;
  if (requestedPosition !== "" && !PLAYER_POSITIONS.has(requestedPosition)) return;

  await prisma.teamMember.updateMany({
    where: { id: membershipId, teamId: team.id },
    data: { position: requestedPosition || null },
  });

  revalidatePath("/");
  revalidatePath("/anmalan");
  revalidatePath("/lag");
  revalidatePath("/statistik");
  revalidatePath("/min-profil");
}
