-- A vigência é um termo do pacote comercial comprado e não deve ser inferida
-- pelo valor, meio de pagamento ou licença MONTHLY/ANNUAL.
ALTER TABLE "payments"
  ADD COLUMN "subscriptionPackageId" TEXT,
  ADD COLUMN "subscriptionValidityMonths" INTEGER;

ALTER TABLE "subscriptions"
  ADD COLUMN "subscriptionPackageId" TEXT;

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_subscription_validity_months_check"
  CHECK (
    "subscriptionValidityMonths" IS NULL
    OR "subscriptionValidityMonths" IN (1, 12)
  );
