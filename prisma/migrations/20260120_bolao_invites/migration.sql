-- CreateTable
CREATE TABLE "bolao_invites" (
    "id" TEXT NOT NULL,
    "rankingId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bolao_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bolao_invites_code_key" ON "bolao_invites"("code");

-- CreateIndex
CREATE INDEX "bolao_invites_rankingId_idx" ON "bolao_invites"("rankingId");

-- AddForeignKey
ALTER TABLE "bolao_invites"
ADD CONSTRAINT "bolao_invites_rankingId_fkey"
FOREIGN KEY ("rankingId") REFERENCES "rankings"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bolao_invites"
ADD CONSTRAINT "bolao_invites_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
