"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DEFAULT_SEASON } from "@/lib/current-user";
import {
  isValidPhone,
  normalizePhone,
  parseHeightCm,
  parseJerseyNo,
  parsePosition,
  parseStickSide,
  TRAINING_DAYS,
  type TrainingDayValue,
  parseWeightKg,
} from "@/lib/player";
import { prisma } from "@/lib/prisma";

export type OnboardingField =
  | "phone"
  | "emergencyContact"
  | "heightCm"
  | "weightKg"
  | "stickSide"
  | "preferredPosition"
  | "jerseyNo"
  | "season";

export type OnboardingState =
  | { error?: string; fieldErrors?: Partial<Record<OnboardingField, string>> }
  | undefined;

const PARTICIPATION_TYPES = new Set(["TRAINING_AND_MATCHES", "TRAINING_ONLY"]);

export async function completeOnboarding(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      isActive: true,
      accessApproved: true,
      onboardedAt: true,
      teams: {
        select: {
          id: true,
          team: { select: { id: true, season: true, archivedAt: true } },
        },
      },
    },
  });

  if (!user || !user.isActive || !user.accessApproved) redirect("/login");
  if (user.onboardedAt) redirect("/");

  const memberships = user.teams.filter((membership) => !membership.team.archivedAt);
  const membership =
    memberships.find((candidate) => candidate.team.season === DEFAULT_SEASON) ??
    memberships[0] ??
    null;

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const emergencyContact = String(formData.get("emergencyContact") ?? "").trim();
  const heightCm = parseHeightCm(String(formData.get("heightCm") ?? ""));
  const weightKg = parseWeightKg(String(formData.get("weightKg") ?? ""));
  const stickSide = parseStickSide(String(formData.get("stickSide") ?? ""));
  const preferredPosition = parsePosition(String(formData.get("preferredPosition") ?? ""));
  const jerseyNo = parseJerseyNo(String(formData.get("jerseyNo") ?? ""));

  const fieldErrors: Partial<Record<OnboardingField, string>> = {};
  if (!isValidPhone(phone)) fieldErrors.phone = "Ange ett telefonnummer, till exempel 070-123 45 67.";
  if (emergencyContact.length > 120) fieldErrors.emergencyContact = "Högst 120 tecken.";
  if (heightCm === undefined) fieldErrors.heightCm = "Ange längden i hela centimeter (80–230).";
  if (weightKg === undefined) fieldErrors.weightKg = "Ange vikten i kilo (20–250).";
  if (stickSide === undefined || stickSide === null) fieldErrors.stickSide = "Välj vänster eller höger fattning.";
  if (preferredPosition === undefined || preferredPosition === null) {
    fieldErrors.preferredPosition = "Välj vilken position du helst spelar.";
  }
  if (jerseyNo === undefined) fieldErrors.jerseyNo = "Välj ett nummer mellan 0 och 99.";

  // Säsongsvalet är bara relevant för ett lag i den pågående säsongen.
  const asksForSeason = Boolean(membership && membership.team.season === DEFAULT_SEASON);
  const playingResponse = String(formData.get("playingThisSeason") ?? "");
  const participationType = String(formData.get("participationType") ?? "");
  const trainingDays = [
    ...new Set(
      formData
        .getAll("trainingDays")
        .map(String)
        .filter((day): day is TrainingDayValue =>
          (TRAINING_DAYS as readonly string[]).includes(day),
        ),
    ),
  ];

  if (asksForSeason) {
    if (playingResponse !== "yes" && playingResponse !== "no") {
      fieldErrors.season = "Svara om du är med den här säsongen.";
    } else if (playingResponse === "yes") {
      if (!PARTICIPATION_TYPES.has(participationType)) {
        fieldErrors.season = "Välj om du är med på matcher eller bara träningar.";
      } else if (trainingDays.length === 0) {
        fieldErrors.season = "Välj minst en träningsdag.";
      }
    }
  }

  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const now = new Date();

  try {
    await prisma.$transaction(
      async (tx) => {
        if (membership && jerseyNo !== null) {
          const taken = await tx.teamMember.findFirst({
            where: { teamId: membership.team.id, jerseyNo, NOT: { id: membership.id } },
            select: { id: true },
          });
          if (taken) throw new Error("JERSEY_TAKEN");
        }

        await tx.user.update({
          where: { id: user.id },
          data: {
            phone,
            emergencyContact: emergencyContact || null,
            heightCm,
            weightKg,
            stickSide,
            onboardedAt: now,
          },
        });

        if (membership) {
          await tx.teamMember.update({
            where: { id: membership.id },
            data: {
              jerseyNo,
              preferredPosition,
              ...(asksForSeason
                ? playingResponse === "yes"
                  ? {
                      playingThisSeason: true,
                      participatesInMatches: participationType === "TRAINING_AND_MATCHES",
                      trainingDays,
                    }
                  : { playingThisSeason: false, participatesInMatches: false, trainingDays: [] }
                : {}),
            },
          });
        }
      },
      // Två nya spelare kan välja samma nummer samtidigt; databasen har ingen
      // unik begränsning på (lag, tröjnummer), så kontrollen ovan behöver en
      // serialiserbar transaktion för att hålla.
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "JERSEY_TAKEN") {
      return {
        fieldErrors: { jerseyNo: "Numret hann bli taget. Välj ett annat ledigt nummer." },
      };
    }
    return { error: "Något gick fel när uppgifterna sparades. Försök igen." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
