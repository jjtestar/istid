-- CreateEnum
CREATE TYPE "PlayerRequestPosition" AS ENUM ('GOALKEEPER', 'SKATER');

-- AlterTable
ALTER TABLE "Highlight" ADD COLUMN     "matchId" TEXT,
ADD COLUMN     "trainingId" TEXT;

-- CreateTable
CREATE TABLE "PlayerRequest" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "trainingId" TEXT,
    "matchId" TEXT,
    "position" "PlayerRequestPosition" NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PlayerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineupPlan" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "trainingId" TEXT,
    "matchId" TEXT,
    "data" JSONB NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineupPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerRequest_teamId_resolvedAt_idx" ON "PlayerRequest"("teamId", "resolvedAt");

-- CreateIndex
CREATE INDEX "PlayerRequest_trainingId_idx" ON "PlayerRequest"("trainingId");

-- CreateIndex
CREATE INDEX "PlayerRequest_matchId_idx" ON "PlayerRequest"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "LineupPlan_trainingId_key" ON "LineupPlan"("trainingId");

-- CreateIndex
CREATE UNIQUE INDEX "LineupPlan_matchId_key" ON "LineupPlan"("matchId");

-- CreateIndex
CREATE INDEX "Highlight_trainingId_idx" ON "Highlight"("trainingId");

-- CreateIndex
CREATE INDEX "Highlight_matchId_idx" ON "Highlight"("matchId");

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRequest" ADD CONSTRAINT "PlayerRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRequest" ADD CONSTRAINT "PlayerRequest_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRequest" ADD CONSTRAINT "PlayerRequest_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRequest" ADD CONSTRAINT "PlayerRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineupPlan" ADD CONSTRAINT "LineupPlan_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineupPlan" ADD CONSTRAINT "LineupPlan_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineupPlan" ADD CONSTRAINT "LineupPlan_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineupPlan" ADD CONSTRAINT "LineupPlan_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Each request/plan belongs to exactly one activity (a training XOR a match), never both or neither.
ALTER TABLE "PlayerRequest" ADD CONSTRAINT "PlayerRequest_activity_check" CHECK (
  ("trainingId" IS NOT NULL AND "matchId" IS NULL) OR ("trainingId" IS NULL AND "matchId" IS NOT NULL)
);

ALTER TABLE "LineupPlan" ADD CONSTRAINT "LineupPlan_activity_check" CHECK (
  ("trainingId" IS NOT NULL AND "matchId" IS NULL) OR ("trainingId" IS NULL AND "matchId" IS NOT NULL)
);
