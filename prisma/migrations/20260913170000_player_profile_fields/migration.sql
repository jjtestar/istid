-- CreateEnum
CREATE TYPE "StickSide" AS ENUM ('LEFT', 'RIGHT');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "heightCm" INTEGER,
ADD COLUMN "weightKg" DOUBLE PRECISION,
ADD COLUMN "stickSide" "StickSide";

-- AlterTable
ALTER TABLE "TeamMember"
ADD COLUMN "playingThisSeason" BOOLEAN;
