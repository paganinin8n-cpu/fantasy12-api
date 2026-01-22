-- ENUMS
CREATE TYPE "SubscriptionPlan" AS ENUM ('MONTHLY', 'ANNUAL');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- SUBSCRIPTIONS
CREATE TABLE "subscriptions" (
  "id" UUID PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "plan" "SubscriptionPlan" NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "startAt" TIMESTAMP NOT NULL,
  "endAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE "subscriptions"
ADD CONSTRAINT "subscriptions_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "users"("id")
ON DELETE CASCADE;

CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- WALLETS
CREATE TABLE "wallets" (
  "id" UUID PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE "wallets"
ADD CONSTRAINT "wallets_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "users"("id")
ON DELETE CASCADE;

-- WALLET LEDGER
CREATE TABLE "wallet_ledger" (
  "id" UUID PRIMARY KEY,
  "walletId" UUID NOT NULL,
  "type" "WalletTransactionType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE "wallet_ledger"
ADD CONSTRAINT "wallet_ledger_walletId_fkey"
FOREIGN KEY ("walletId")
REFERENCES "wallets"("id")
ON DELETE CASCADE;

CREATE INDEX "wallet_ledger_walletId_idx" ON "wallet_ledger"("walletId");

-- ROUND BENEFITS (FREE)
CREATE TABLE "round_benefits" (
  "id" UUID PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "roundId" TEXT NOT NULL,
  "freeDoubles" INTEGER NOT NULL DEFAULT 0,
  "freeSuperDoubles" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE ("userId", "roundId")
);

ALTER TABLE "round_benefits"
ADD CONSTRAINT "round_benefits_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "users"("id")
ON DELETE CASCADE;

ALTER TABLE "round_benefits"
ADD CONSTRAINT "round_benefits_roundId_fkey"
FOREIGN KEY ("roundId")
REFERENCES "rounds"("id")
ON DELETE CASCADE;

CREATE INDEX "round_benefits_roundId_idx" ON "round_benefits"("roundId");
