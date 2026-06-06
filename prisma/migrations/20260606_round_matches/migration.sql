CREATE TABLE "round_matches" (
  "id" TEXT NOT NULL,
  "roundId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "homeTeam" TEXT NOT NULL,
  "awayTeam" TEXT NOT NULL,
  "groupLabel" TEXT,
  "matchTime" TIMESTAMP(3),
  "result" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "round_matches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "round_matches_roundId_position_key" ON "round_matches"("roundId", "position");
CREATE INDEX "round_matches_roundId_idx" ON "round_matches"("roundId");

ALTER TABLE "round_matches"
ADD CONSTRAINT "round_matches_roundId_fkey"
FOREIGN KEY ("roundId")
REFERENCES "rounds"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
