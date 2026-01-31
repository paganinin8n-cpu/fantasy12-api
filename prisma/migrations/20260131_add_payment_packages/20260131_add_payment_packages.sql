CREATE TABLE "PaymentPackage" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "coinsAmount" INTEGER NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "bonusCoins" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentPackage_pkey" PRIMARY KEY ("id")
);
