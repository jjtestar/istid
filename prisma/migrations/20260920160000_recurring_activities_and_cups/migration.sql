-- Återkommande träningar/matcher och cuper:
--   * Training.seriesId / Match.seriesId binder ihop tillfällen som skapats
--     i samma serie, så att hela serien kan tas bort på en gång.
--   * Match.kind skiljer en vanlig match från en cup (där "opponent" i
--     stället bär cupens namn), och Match.endsAt ger cuper en sluttid.
--
-- Skrivs idempotent i samma stil som 20260920140000_player_onboarding, så att
-- en redan uppdaterad databas kan köra migrationen igen utan fel.

-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "MatchKind" AS ENUM ('MATCH', 'CUP');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- AlterTable
ALTER TABLE "Training" ADD COLUMN IF NOT EXISTS "seriesId" TEXT;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "seriesId" TEXT;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "endsAt" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "kind" "MatchKind" NOT NULL DEFAULT 'MATCH';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Training_seriesId_idx" ON "Training"("seriesId");
CREATE INDEX IF NOT EXISTS "Match_seriesId_idx" ON "Match"("seriesId");
