-- ======================
-- RANKING SNAPSHOT
-- ======================

CREATE TABLE "ranking_snapshots" (
  "id" UUID NOT NULL,
  "roundId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,

  "scoreTotal" INTEGER NOT NULL,
  "scoreRound" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,

  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),

  CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "ranking_snapshots_roundId_fkey"
    FOREIGN KEY ("roundId")
    REFERENCES "rounds"("id")
    ON DELETE CASCADE,

  CONSTRAINT "ranking_snapshots_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "users"("id")
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX "ranking_snapshots_roundId_userId_key"
  ON "ranking_snapshots" ("roundId", "userId");

CREATE INDEX "ranking_snapshots_roundId_idx"
  ON "ranking_snapshots" ("roundId");

CREATE INDEX "ranking_snapshots_userId_idx"
  ON "ranking_snapshots" ("userId");
