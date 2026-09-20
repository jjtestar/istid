-- CreateIndex
CREATE INDEX IF NOT EXISTS "Training_teamId_startsAt_idx" ON "Training"("teamId", "startsAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Match_teamId_startsAt_idx" ON "Match"("teamId", "startsAt");
