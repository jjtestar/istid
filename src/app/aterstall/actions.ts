"use server";

import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { isValidPinShape, normalizeEmail, normalizePin, secureHash } from "@/lib/invite-security";
import { prisma } from "@/lib/prisma";
import { guardAttempts, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";

export type ResetState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "pin" | "password", string>>;
} | undefined;

export async function resetPassword(
  _previousState: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const pin = normalizePin(String(formData.get("pin") ?? ""));
  const password = String(formData.get("password") ?? "");
  const repeated = String(formData.get("passwordRepeat") ?? "");
  const fieldErrors: Partial<Record<"email" | "pin" | "password", string>> = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "Ange en giltig e-postadress.";
  if (!isValidPinShape(pin)) fieldErrors.pin = "Ange återställningskoden du fått, 8 siffror.";
  if (password.length < 8 || !/[A-Za-zÅÄÖåäö]/.test(password) || !/\d/.test(password)) {
    fieldErrors.password = "Minst 8 tecken, med både bokstav och siffra.";
  } else if (password !== repeated) {
    fieldErrors.password = "Lösenorden matchar inte.";
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const now = new Date();
  const attempts = await guardAttempts("password-reset", email);
  if (attempts.blocked) return { error: RATE_LIMIT_MESSAGE };

  const reset = await prisma.passwordResetCode.findUnique({
    where: { codeHash: secureHash(pin, "password-reset") },
    include: { user: { select: { id: true, email: true, isActive: true, accessApproved: true } } },
  });
  const usable =
    reset &&
    reset.user.email === email &&
    reset.user.isActive &&
    reset.user.accessApproved &&
    !reset.usedAt &&
    !reset.revokedAt &&
    reset.expiresAt > now;

  if (!usable) {
    await attempts.fail();
    return { error: "Koden är ogiltig, förbrukad eller har gått ut. Be administratören om en ny." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordResetCode.updateMany({
      where: { id: reset.id, usedAt: null, revokedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) throw new Error("RESET_ALREADY_USED");

    await tx.user.update({ where: { id: reset.userId }, data: { passwordHash } });
    // Any other code outstanding for this account dies with the one just used.
    await tx.passwordResetCode.updateMany({
      where: { userId: reset.userId, usedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
  });

  await attempts.succeed();
  await signIn("credentials", { email, password, redirectTo: "/" });
}
