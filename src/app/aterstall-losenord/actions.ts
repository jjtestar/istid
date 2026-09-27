"use server";

import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { normalizeEmail, normalizePin, secureHash } from "@/lib/invite-security";
import { prisma } from "@/lib/prisma";
import { isRateLimited, recordAttemptFailure } from "@/lib/rate-limit";

export type ResetPasswordState = { error?: string; success?: boolean } | undefined;

async function attemptKey(email: string) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return secureHash(`${email}:${forwarded}`, "password-reset-attempt");
}

export async function resetPassword(_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const code = normalizePin(String(formData.get("code") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Ange en giltig e-postadress." };
  if (!/^\d{6}$/.test(code)) return { error: "Koden ska bestå av 6 siffror." };
  if (password.length < 8 || !/[A-Za-zÅÄÖåäö]/.test(password) || !/\d/.test(password)) {
    return { error: "Lösenordet måste vara minst 8 tecken, med både bokstav och siffra." };
  }

  const keyHash = await attemptKey(email);
  if (await isRateLimited(keyHash)) return { error: "För många försök. Vänta 15 minuter och försök igen." };

  const now = new Date();
  const codeHash = secureHash(code, "password-reset");
  const reset = await prisma.passwordResetCode.findUnique({
    where: { codeHash },
    select: {
      id: true,
      userId: true,
      usedAt: true,
      revokedAt: true,
      expiresAt: true,
      user: { select: { email: true, isActive: true, accessApproved: true } },
    },
  });
  const validReset =
    reset &&
    reset.user.email === email &&
    reset.user.isActive &&
    reset.user.accessApproved &&
    !reset.usedAt &&
    !reset.revokedAt &&
    reset.expiresAt > now;

  if (!validReset) {
    await recordAttemptFailure(keyHash);
    return { error: "Koden är ogiltig, förbrukad eller har gått ut." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetCode.updateMany({
        where: { id: reset.id, usedAt: null, revokedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) throw new Error("CODE_ALREADY_USED");
      await tx.user.update({ where: { id: reset.userId }, data: { passwordHash } });
      await tx.registrationAttempt.deleteMany({ where: { keyHash } });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CODE_ALREADY_USED") {
      return { error: "Koden har redan använts." };
    }
    throw error;
  }

  return { success: true };
}
