CREATE TABLE "RankingSnapshot" (
  "id" UUID NOT NULL,
  "roundId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "scoreTotal" INTEGER NOT NULL,
  "scoreRound" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RankingSnapshot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RankingSnapshot_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RankingSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RankingSnapshot_roundId_userId_key"
ON "RankingSnapshot"("roundId", "userId");

CREATE INDEX "RankingSnapshot_roundId_idx"
ON "RankingSnapshot"("roundId");

CREATE INDEX "RankingSnapshot_userId_idx"
ON "RankingSnapshot"("userId");
