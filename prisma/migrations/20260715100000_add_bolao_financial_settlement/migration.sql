ALTER TABLE "rankings"
  ADD COLUMN "prizeDistribution" JSONB,
  ADD COLUMN "grossCollected" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "platformFee" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "prizePool" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "settledAt" TIMESTAMP(3);

ALTER TABLE "ranking_participants"
  ADD COLUMN "entryFeePaid" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "entryPaidAt" TIMESTAMP(3);

ALTER TABLE "wallet_ledger"
  ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "wallet_ledger_idempotencyKey_key"
  ON "wallet_ledger"("idempotencyKey");
