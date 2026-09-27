import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * Shared per-(purpose+identity) rate limiter for auth entry points (login,
 * registration, password reset). Backed by `RegistrationAttempt` — the model
 * name is historical, but the table is keyed by an opaque HMAC hash so it's
 * fine to share across every attempt-limited flow.
 */
export async function isRateLimited(keyHash: string) {
  const attempt = await prisma.registrationAttempt.findUnique({ where: { keyHash } });
  return Boolean(attempt?.blockedUntil && attempt.blockedUntil > new Date());
}

export async function recordAttemptFailure(keyHash: string) {
  const now = new Date();
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
