"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { normalizeEmail, secureHash } from "@/lib/invite-security";
import { prisma } from "@/lib/prisma";
import { isRateLimited, recordAttemptFailure } from "@/lib/rate-limit";

async function attemptKey(email: string) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return secureHash(`${email}:${forwarded}`, "login-attempt");
}

export async function authenticate(
  _previousState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const keyHash = await attemptKey(email);

  if (await isRateLimited(keyHash)) {
    return "För många felaktiga försök. Vänta 15 minuter och försök igen.";
  }

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      await recordAttemptFailure(keyHash);
      return "Fel e-postadress eller lösenord.";
    }
    throw error;
  }

  await prisma.registrationAttempt.deleteMany({ where: { keyHash } });
  redirect("/");
}
