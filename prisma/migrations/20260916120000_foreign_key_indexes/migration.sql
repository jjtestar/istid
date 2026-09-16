-- Postgres does not create indexes for foreign keys automatically, and the
-- composite unique indexes that already exist all lead with the *other*
-- column, so none of them can serve these lookups. Every one of these columns
-- is filtered on during an ordinary page load.

-- "which teams does this user belong to" — runs on every request
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- team calendars and dashboards: filter by team, order/range by start time
CREATE INDEX "Training_teamId_startsAt_idx" ON "Training"("teamId", "startsAt");
CREATE INDEX "Match_teamId_startsAt_idx" ON "Match"("teamId", "startsAt");

-- "my registrations" joins on the calendar and statistics pages
CREATE INDEX "TrainingRegistration_userId_idx" ON "TrainingRegistration"("userId");
CREATE INDEX "MatchRegistration_userId_idx" ON "MatchRegistration"("userId");
CREATE INDEX "MatchStat_userId_idx" ON "MatchStat"("userId");

-- lineup plans looked up per team
CREATE INDEX "LineupPlan_teamId_idx" ON "LineupPlan"("teamId");
