-- AlterTable
ALTER TABLE "TrainingRegistration" ADD COLUMN "attended" BOOLEAN;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN "isHome" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN "position" TEXT;
