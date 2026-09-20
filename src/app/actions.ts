"use server";

import type { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { DEFAULT_SEASON, getCurrentUser, getCurrentUserWithTeam, teamSlug } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import type { RsvpResult } from "@/lib/rsvp";

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
  const user = await getCurrentUser();
  const requestedTeam = String(formData.get("teamSlug") ?? "");
  const requestedSeason = String(formData.get("season") ?? "");
  const availableTeams = await prisma.team.findMany({
    where: {
      archivedAt: null,
      ...(user.role === "ADMIN" || user.isSuperAdmin ? {} : { members: { some: { userId: user.id } } }),
    },
    select: { name: true, season: true },
  });
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

/**
 * Resolves the team that owns an activity, in a single query that also enforces
 * the season window and (through `scope`) who is allowed to answer for it.
 */
function findEligibleTeam(kind: "training" | "match", id: string, scope: Prisma.TeamWhereInput) {
  return prisma.team.findFirst({
    where: {
      season: DEFAULT_SEASON,
      ...(kind === "training" ? { trainings: { some: { id } } } : { matches: { some: { id } } }),
      ...scope,
    },
    select: { id: true },
  });
}

/**
 * Records one RSVP. Deliberately lean: identity and eligibility resolve in two
 * parallel queries rather than by building the cookie-selected team context, so
 * the roundtrip the player is waiting on stays as short as the write allows.
 */
async function saveRsvp(
  kind: "training" | "match",
  id: string,
  formData: FormData,
): Promise<RsvpResult> {
  const response = getResponse(formData);
  if (!id || !response) return { ok: false, error: "Ogiltigt svar. Ladda om sidan och försök igen." };

  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, error: "Du är utloggad. Logga in igen." };

  const [user, memberTeam] = await Promise.all([
    prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, isSuperAdmin: true, isActive: true, accessApproved: true },
    }),
    findEligibleTeam(kind, id, { members: { some: { user: { email } } } }),
  ]);

  if (!user?.isActive || !user.accessApproved) {
    return { ok: false, error: "Ditt konto saknar behörighet. Kontakta en administratör." };
  }

  // Admins answer for activities in teams they are not members of, which the
  // membership-scoped lookup above deliberately misses.
  const isAdmin = user.role === "ADMIN" || user.isSuperAdmin;
  const team = memberTeam ?? (isAdmin ? await findEligibleTeam(kind, id, {}) : null);
  if (!team) {
    return { ok: false, error: "Aktiviteten går inte att anmäla sig till. Ladda om sidan." };
  }

  if (kind === "training") {
    await prisma.trainingRegistration.upsert({
      where: { trainingId_userId: { trainingId: id, userId: user.id } },
      update: response,
      create: { trainingId: id, userId: user.id, ...response },
    });
  } else {
    await prisma.matchRegistration.upsert({
      where: { matchId_userId: { matchId: id, userId: user.id } },
      update: response,
      create: { matchId: id, userId: user.id, ...response },
    });
  }

  revalidatePath("/");
  revalidatePath("/anmalan");
  revalidatePath("/kalender");
  return { ok: true };
}

export async function respondToTraining(formData: FormData) {
  return saveRsvp("training", String(formData.get("trainingId") ?? ""), formData);
}

export async function respondToMatch(formData: FormData) {
  return saveRsvp("match", String(formData.get("matchId") ?? ""), formData);
}

export async function updatePlayerDetails(formData: FormData) {
  const { user, membership } = await getCurrentUserWithTeam();
  const jerseyValue = String(formData.get("jerseyNo") ?? "").trim();
  const heightValue = String(formData.get("heightCm") ?? "").trim();
  const weightValue = String(formData.get("weightKg") ?? "").trim();
  const requestedStickSide = String(formData.get("stickSide") ?? "").trim();

  const parsedJerseyNo = jerseyValue === "" ? null : Number(jerseyValue);
  const jerseyNo =
    parsedJerseyNo !== null && Number.isInteger(parsedJerseyNo) && parsedJerseyNo >= 0 && parsedJerseyNo <= 99
      ? parsedJerseyNo
      : parsedJerseyNo === null
        ? null
        : undefined;
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

  if (jerseyNo === undefined || heightCm === undefined || weightKg === undefined || stickSide === undefined) {
    return false;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { heightCm, weightKg, stickSide } }),
    ...(membership
      ? [prisma.teamMember.update({ where: { id: membership.id }, data: { jerseyNo } })]
      : []),
  ]);

  revalidatePath("/");
  revalidatePath("/lag");
  revalidatePath("/statistik");
  revalidatePath("/min-profil");
  return true;
}

export async function updateSeasonParticipation(formData: FormData) {
  const { team, membership } = await getCurrentUserWithTeam();
  const response = String(formData.get("playingThisSeason") ?? "");

  if (!membership || !team || team.season !== DEFAULT_SEASON) return false;
  if (response !== "yes" && response !== "no") return false;

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

    if (!PARTICIPATION_TYPES.has(participationType) || trainingDays.length === 0) return false;

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
  return true;
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
