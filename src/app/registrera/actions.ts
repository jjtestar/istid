"use server";

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { isValidPinShape, normalizeEmail, normalizePin, secureHash } from "@/lib/invite-security";
import { prisma } from "@/lib/prisma";
import { guardAttempts, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";

export type RegistrationState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password" | "pin" | "age", string>>;
} | undefined;

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
  if (!isValidPinShape(pin)) fieldErrors.pin = "Ange PIN-koden du fått, 8 siffror.";
  if (!acceptedAge) fieldErrors.age = "Du måste bekräfta att du är minst 18 år.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const now = new Date();
  const attempts = await guardAttempts("registration", email);
  if (attempts.blocked) return { error: RATE_LIMIT_MESSAGE };

  const codeHash = secureHash(pin, "invite");
  const invite = await prisma.inviteCode.findUnique({ where: { codeHash } });
  const validInvite =
    invite &&
    invite.email === email &&
    !invite.usedAt &&
    !invite.revokedAt &&
    invite.expiresAt > now;

  if (!validInvite) {
    await attempts.fail();
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

  await attempts.succeed();
  await signIn("credentials", { email, password, redirectTo: "/" });
}
