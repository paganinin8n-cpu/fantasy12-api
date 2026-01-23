-- v1.5 Subscription Recorrente (Mercado Pago)
-- Migration incremental controlada (sem migrate dev)

ALTER TABLE "subscriptions"
ADD COLUMN IF NOT EXISTS "provider" "PaymentProvider",
ADD COLUMN IF NOT EXISTS "externalSubscriptionId" TEXT,
ADD COLUMN IF NOT EXISTS "externalCustomerId" TEXT;
