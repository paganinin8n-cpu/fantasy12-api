-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('CLUB', 'NATIONAL');

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "country" TEXT,
    "type" "TeamType" NOT NULL DEFAULT 'CLUB',
    "logoUrl" TEXT,
    "externalId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_externalId_key" ON "teams"("externalId");
CREATE INDEX "teams_name_idx" ON "teams"("name");
CREATE INDEX "teams_country_idx" ON "teams"("country");
CREATE INDEX "teams_type_idx" ON "teams"("type");

-- AlterTable: add optional team FK columns to round_matches
ALTER TABLE "round_matches" ADD COLUMN "homeTeamId" TEXT;
ALTER TABLE "round_matches" ADD COLUMN "awayTeamId" TEXT;

-- CreateIndex
CREATE INDEX "round_matches_homeTeamId_idx" ON "round_matches"("homeTeamId");
CREATE INDEX "round_matches_awayTeamId_idx" ON "round_matches"("awayTeamId");

-- AddForeignKey
ALTER TABLE "round_matches" ADD CONSTRAINT "round_matches_homeTeamId_fkey"
  FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "round_matches" ADD CONSTRAINT "round_matches_awayTeamId_fkey"
  FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
