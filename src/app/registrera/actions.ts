"use server";

import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { normalizeEmail, normalizePin, secureHash } from "@/lib/invite-security";
import { prisma } from "@/lib/prisma";

export type RegistrationState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password" | "pin" | "age", string>>;
} | undefined;

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

async function attemptKey(email: string) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return secureHash(`${email}:${forwarded}`, "registration-attempt");
}

async function isBlocked(keyHash: string, now: Date) {
  const attempt = await prisma.registrationAttempt.findUnique({ where: { keyHash } });
  return Boolean(attempt?.blockedUntil && attempt.blockedUntil > now);
}

async function recordFailure(keyHash: string, now: Date) {
  const current = await prisma.registrationAttempt.findUnique({ where: { keyHash } });
  const freshWindow = !current || now.getTime() - current.windowStartedAt.getTime() >= WINDOW_MS;
  const attempts = freshWindow ? 1 : current.attempts + 1;
  await prisma.registrationAttempt.upsert({
    where: { keyHash },
    create: {
      keyHash,
      attempts,
      windowStartedAt: now,
      blockedUntil: attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + WINDOW_MS) : null,
    },
    update: {
      attempts,
      windowStartedAt: freshWindow ? now : current!.windowStartedAt,
      blockedUntil: attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + WINDOW_MS) : null,
    },
  });
}

export async function registerUser(
  _previousState: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const pin = normalizePin(String(formData.get("pin") ?? ""));
  const acceptedAge = formData.get("ageConfirmed") === "yes";
  const fieldErrors: Partial<Record<"name" | "email" | "password" | "pin" | "age", string>> = {};

  if (name.length < 2 || name.length > 80) fieldErrors.name = "Ange ditt fullständiga namn.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "Ange en giltig e-postadress.";
  if (password.length < 8 || !/[A-Za-zÅÄÖåäö]/.test(password) || !/\d/.test(password)) {
    fieldErrors.password = "Minst 8 tecken, med både bokstav och siffra.";
  }
  if (!/^\d{6}$/.test(pin)) fieldErrors.pin = "PIN-koden ska bestå av 6 siffror.";
  if (!acceptedAge) fieldErrors.age = "Du måste bekräfta att du är minst 18 år.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const now = new Date();
  const keyHash = await attemptKey(email);
  if (await isBlocked(keyHash, now)) {
    return { error: "För många försök. Vänta 15 minuter och försök igen." };
  }

  const codeHash = secureHash(pin, "invite");
  const invite = await prisma.inviteCode.findUnique({ where: { codeHash } });
  const validInvite =
    invite &&
    invite.email === email &&
    !invite.usedAt &&
    !invite.revokedAt &&
    invite.expiresAt > now;

  if (!validInvite) {
    await recordFailure(keyHash, now);
    return { error: "PIN-koden är ogiltig, förbrukad eller har gått ut." };
  }

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "Det finns redan ett konto med den e-postadressen. Logga in i stället." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.inviteCode.updateMany({
        where: { id: invite.id, usedAt: null, revokedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) throw new Error("INVITE_ALREADY_USED");

      const user = await tx.user.create({
        data: { name, email, passwordHash, role: "PLAYER", isActive: true, accessApproved: true },
      });
      await tx.teamMember.create({ data: { teamId: invite.teamId, userId: user.id } });
      await tx.inviteCode.update({ where: { id: invite.id }, data: { usedById: user.id } });
      await tx.registrationAttempt.deleteMany({ where: { keyHash } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Kontot eller PIN-koden används redan. Prova att logga in." };
    }
    if (error instanceof Error && error.message === "INVITE_ALREADY_USED") {
      return { error: "PIN-koden har redan använts." };
    }
    throw error;
  }

  await signIn("credentials", { email, password, redirectTo: "/" });
}
