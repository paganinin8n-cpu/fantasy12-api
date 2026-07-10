CREATE TYPE "PaymentPurpose" AS ENUM ('WALLET_CREDIT', 'SUBSCRIPTION');

ALTER TABLE "payments"
  ADD COLUMN "purpose" "PaymentPurpose" NOT NULL DEFAULT 'WALLET_CREDIT',
  ADD COLUMN "subscriptionPlan" "SubscriptionPlan",
  ADD COLUMN "externalPreferenceId" TEXT,
  ADD COLUMN "checkoutUrl" TEXT,
  ADD COLUMN "processedAt" TIMESTAMP(3),
  ALTER COLUMN "packageId" DROP NOT NULL;

CREATE UNIQUE INDEX "payments_externalPreferenceId_key"
  ON "payments"("externalPreferenceId");
