-- CreateEnum
CREATE TYPE "HighlightType" AS ENUM ('GOAL', 'SAVE', 'BLOOPER', 'OTHER');

-- CreateEnum
CREATE TYPE "HighlightPlayerRole" AS ENUM ('SCORER', 'ASSIST', 'GOALKEEPER');

-- AlterTable
ALTER TABLE "Highlight" ADD COLUMN     "type" "HighlightType" NOT NULL DEFAULT 'GOAL';

-- CreateTable
CREATE TABLE "HighlightPlayer" (
    "id" TEXT NOT NULL,
    "highlightId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "HighlightPlayerRole" NOT NULL,

    CONSTRAINT "HighlightPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HighlightPlayer_userId_idx" ON "HighlightPlayer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HighlightPlayer_highlightId_userId_role_key" ON "HighlightPlayer"("highlightId", "userId", "role");

-- AddForeignKey
ALTER TABLE "HighlightPlayer" ADD CONSTRAINT "HighlightPlayer_highlightId_fkey" FOREIGN KEY ("highlightId") REFERENCES "Highlight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighlightPlayer" ADD CONSTRAINT "HighlightPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
