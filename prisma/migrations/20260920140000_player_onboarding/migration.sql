-- Introducerar välkomstformuläret på /valkommen: kontaktuppgifter, önskad
-- position och en markering av att formuläret är ifyllt.
--
-- Skrivs idempotent i samma stil som 20260920130000_sync_schema_with_production,
-- så att en redan uppdaterad databas kan köra migrationen igen utan fel.

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "preferredPosition" TEXT;

-- Befintliga konton är redan upplagda för hand av en administratör och ska
-- inte mötas av välkomstformuläret vid nästa inloggning.
UPDATE "User" SET "onboardedAt" = "createdAt" WHERE "onboardedAt" IS NULL;
