import { headers } from "next/headers";
import { secureHash } from "@/lib/invite-security";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
/** Failures allowed per (identity, IP) before that pair is locked out. */
const PER_IDENTITY_MAX = 5;
/**
 * Failures allowed per IP across *all* identities. Without this a single host
 * can spray one password across hundreds of accounts, or work through a PIN
 * space, and never trip the per-identity counter.
 */
const PER_IP_MAX = 20;

export type AttemptScope = "login" | "registration" | "password-reset" | "password-change";

type Bucket = { keyHash: string; max: number };

export type AttemptGuard = {
  /** True when either the identity or the whole IP is currently locked out. */
  blocked: boolean;
  /** Count this attempt as failed against every bucket. */
  fail: () => Promise<void>;
  /** Clear the counters after a successful attempt. */
  succeed: () => Promise<void>;
};

/**
 * On Vercel the platform sets x-forwarded-for, so the first entry is the real
 * client. Behind any other proxy this value is only as trustworthy as that
 * proxy — the per-identity bucket is the one that must hold regardless.
 */
async function clientAddress() {
  const requestHeaders = await headers();
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function isBucketBlocked(bucket: Bucket, now: Date) {
  const attempt = await prisma.registrationAttempt.findUnique({ where: { keyHash: bucket.keyHash } });
  return Boolean(attempt?.blockedUntil && attempt.blockedUntil > now);
}

async function recordBucketFailure(bucket: Bucket, now: Date) {
  const current = await prisma.registrationAttempt.findUnique({ where: { keyHash: bucket.keyHash } });
  const freshWindow = !current || now.getTime() - current.windowStartedAt.getTime() >= WINDOW_MS;
  const attempts = freshWindow ? 1 : current.attempts + 1;
  const blockedUntil = attempts >= bucket.max ? new Date(now.getTime() + WINDOW_MS) : null;
  await prisma.registrationAttempt.upsert({
    where: { keyHash: bucket.keyHash },
    create: { keyHash: bucket.keyHash, attempts, windowStartedAt: now, blockedUntil },
    update: {
      attempts,
      windowStartedAt: freshWindow ? now : current!.windowStartedAt,
      blockedUntil,
    },
  });
}

/**
 * Builds the two counters that guard a credential-checking endpoint: one for
 * this identity from this IP, one for this IP as a whole.
 */
export async function guardAttempts(scope: AttemptScope, identity: string): Promise<AttemptGuard> {
  const address = await clientAddress();
  const now = new Date();
  const buckets: Bucket[] = [
    { keyHash: secureHash(`${scope}:${identity}:${address}`, `${scope}-attempt`), max: PER_IDENTITY_MAX },
    { keyHash: secureHash(`${scope}:${address}`, "ip-attempt"), max: PER_IP_MAX },
  ];

  const blockedFlags = await Promise.all(buckets.map((bucket) => isBucketBlocked(bucket, now)));

  return {
    blocked: blockedFlags.some(Boolean),
    fail: async () => {
      for (const bucket of buckets) await recordBucketFailure(bucket, now);
      await pruneStaleAttempts(now);
    },
    succeed: async () => {
      await prisma.registrationAttempt.deleteMany({
        where: { keyHash: { in: buckets.map((bucket) => bucket.keyHash) } },
      });
    },
  };
}

/**
 * Counters are only meaningful for one window, but rows for attempts that were
 * never followed by a success would otherwise accumulate forever. Pruning on
 * failure keeps the table bounded without needing a scheduled job; failures are
 * rare enough that the extra delete costs nothing.
 */
async function pruneStaleAttempts(now: Date) {
  await prisma.registrationAttempt.deleteMany({
    where: { updatedAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
  });
}

/** Shown to the user whenever `blocked` is true. */
export const RATE_LIMIT_MESSAGE = "För många försök. Vänta 15 minuter och försök igen.";
