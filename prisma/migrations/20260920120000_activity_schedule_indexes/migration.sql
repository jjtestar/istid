-- CreateIndex
CREATE INDEX "Training_teamId_startsAt_idx" ON "Training"("teamId", "startsAt");

-- CreateIndex
CREATE INDEX "Match_teamId_startsAt_idx" ON "Match"("teamId", "startsAt");
