"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { normalizeEmail, secureHash } from "@/lib/invite-security";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

async function attemptKey(email: string) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return secureHash(`${email}:${forwarded}`, "login-attempt");
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

export async function authenticate(
  _previousState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const now = new Date();
  const keyHash = await attemptKey(email);

  if (await isBlocked(keyHash, now)) {
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
      await recordFailure(keyHash, now);
      return "Fel e-postadress eller lösenord.";
    }
    throw error;
  }

  await prisma.registrationAttempt.deleteMany({ where: { keyHash } });
  redirect("/");
}
