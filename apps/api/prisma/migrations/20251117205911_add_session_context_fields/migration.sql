-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "durationSecs" INTEGER,
ADD COLUMN     "exerciseId" TEXT,
ADD COLUMN     "phaseLabel" TEXT,
ADD COLUMN     "sessionType" TEXT;
