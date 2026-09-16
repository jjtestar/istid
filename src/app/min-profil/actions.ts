"use server";

import bcrypt from "bcryptjs";
import { requireActiveUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { guardAttempts, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";

export type PasswordChangeState = { error?: string; success?: string } | undefined;

export async function changePassword(
  _previousState: PasswordChangeState,
  formData: FormData,
): Promise<PasswordChangeState> {
  const user = await requireActiveUser();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const repeated = String(formData.get("newPasswordRepeat") ?? "");

  if (next.length < 8 || !/[A-Za-zÅÄÖåäö]/.test(next) || !/\d/.test(next)) {
    return { error: "Det nya lösenordet måste ha minst 8 tecken, med både bokstav och siffra." };
  }
  if (next !== repeated) return { error: "De nya lösenorden matchar inte." };
  if (next === current) return { error: "Välj ett annat lösenord än det nuvarande." };

  // Someone who got hold of an unlocked session still has to know the old
  // password, and can't sit and guess it.
  const attempts = await guardAttempts("password-change", user.id);
  if (attempts.blocked) return { error: RATE_LIMIT_MESSAGE };

  if (!user.passwordHash || !(await bcrypt.compare(current, user.passwordHash))) {
    await attempts.fail();
    return { error: "Nuvarande lösenord stämmer inte." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 12) },
  });
  // Any reset code an administrator handed out is void once the user sets
  // their own password.
  await prisma.passwordResetCode.updateMany({
    where: { userId: user.id, usedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await attempts.succeed();
  return { success: "Lösenordet är uppdaterat." };
}
