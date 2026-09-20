-- Brings prisma/migrations back in line with the production database, which had
-- drifted ahead of this repository: 20260916120000_foreign_key_indexes and
-- 20260916121000_password_reset_codes were applied there but exist in no commit,
-- so a database built from this repo alone was missing their objects.
--
-- Written idempotently because production already has every object below. Both
-- original migrations stay recorded in production's _prisma_migrations; this one
-- only makes a fresh database reach the same shape.

-- CreateTable
CREATE TABLE IF NOT EXISTS "PasswordResetCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetCode_codeHash_key" ON "PasswordResetCode"("codeHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PasswordResetCode_userId_createdAt_idx" ON "PasswordResetCode"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PasswordResetCode_createdById_idx" ON "PasswordResetCode"("createdById");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "PasswordResetCode" ADD CONSTRAINT "PasswordResetCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "PasswordResetCode" ADD CONSTRAINT "PasswordResetCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TrainingRegistration_userId_idx" ON "TrainingRegistration"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MatchRegistration_userId_idx" ON "MatchRegistration"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MatchStat_userId_idx" ON "MatchStat"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LineupPlan_teamId_idx" ON "LineupPlan"("teamId");
