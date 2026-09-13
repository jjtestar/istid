-- CreateEnum
CREATE TYPE "TrainingDay" AS ENUM ('TUESDAY', 'THURSDAY', 'SATURDAY');

-- AlterTable
ALTER TABLE "TeamMember"
ADD COLUMN "participatesInMatches" BOOLEAN,
ADD COLUMN "trainingDays" "TrainingDay"[] NOT NULL DEFAULT ARRAY[]::"TrainingDay"[];

-- Preserve existing season choices as full availability.
UPDATE "TeamMember"
SET
  "participatesInMatches" = CASE
    WHEN "playingThisSeason" = TRUE THEN TRUE
    WHEN "playingThisSeason" = FALSE THEN FALSE
    ELSE NULL
  END,
  "trainingDays" = CASE
    WHEN "playingThisSeason" = TRUE
      THEN ARRAY['TUESDAY', 'THURSDAY', 'SATURDAY']::"TrainingDay"[]
    ELSE ARRAY[]::"TrainingDay"[]
  END;
